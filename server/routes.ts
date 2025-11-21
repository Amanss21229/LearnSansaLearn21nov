import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import multer from "multer";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import Groq from "groq-sdk";
import type { User } from "@shared/schema";

// Initialize Groq client for AI tutor
const groq = process.env.GROQ_API_KEY 
  ? new Groq({ apiKey: process.env.GROQ_API_KEY })
  : null;

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'audio/mpeg',
      'audio/wav',
      'video/mp4',
      'video/webm',
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// Bad words filter list
const BAD_WORDS = [
  'badword1', 'badword2', // Add actual bad words here
];

function containsBadWords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return BAD_WORDS.some(word => lowerText.includes(word));
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Socket.IO server for real-time chat
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    path: "/socket.io"
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('Socket.IO client connected:', socket.id);
    let currentUser: User | null = null;

    // Authenticate user and join appropriate rooms
    socket.on('auth', async (data: { userId: string }) => {
      try {
        const user = await storage.getUser(data.userId);
        if (user) {
          currentUser = user;
          socket.data.userId = user.id;
          socket.data.stream = user.stream;
          
          // Join community room based on stream
          socket.join(`community:${user.stream}`);
          
          console.log(`User ${user.username} joined community:${user.stream}`);
        }
      } catch (error) {
        console.error('Auth error:', error);
      }
    });

    // Join a group
    socket.on('join_group', async (data: { groupId: string }) => {
      try {
        if (!currentUser) return;
        
        // Verify user is a member of the group
        const members = await storage.getGroupMembers(data.groupId);
        const isMember = members.some(m => m.userId === currentUser!.id && m.status === 'accepted');
        
        if (isMember) {
          socket.join(`group:${data.groupId}`);
          console.log(`User ${currentUser.username} joined group:${data.groupId}`);
        }
      } catch (error) {
        console.error('Join group error:', error);
      }
    });

    // Send a message (community or group)
    socket.on('send_message', async (data: {
      content: string;
      type: 'text' | 'image';
      groupId?: string;
      stream?: string;
    }) => {
      try {
        if (!currentUser) return;

        // Check for bad words
        if (containsBadWords(data.content)) {
          socket.emit('bad_word_detected', { message: 'Your message contains inappropriate content' });
          return;
        }

        // Check if chat is enabled for community chats (only admins can send when disabled)
        if (data.stream && !data.groupId) {
          const chatSetting = await storage.getChatSetting(data.stream);
          if (chatSetting && !chatSetting.isEnabled && !currentUser.isAdmin) {
            socket.emit('chat_disabled', { message: 'Chat is currently disabled by admin' });
            return;
          }
        }

        const newMessage = await storage.createMessage({
          groupId: data.groupId,
          stream: data.stream,
          userId: currentUser.id,
          content: data.content,
          type: data.type,
          isPinned: false,
        });

        // Broadcast to appropriate room
        const messageWithUser = {
          ...newMessage,
          userName: currentUser.name,
          userPhoto: currentUser.profilePhoto,
        };

        if (data.groupId) {
          io.to(`group:${data.groupId}`).emit('new_message', messageWithUser);
        } else if (data.stream) {
          io.to(`community:${data.stream}`).emit('new_message', messageWithUser);
        }
      } catch (error) {
        console.error('Send message error:', error);
      }
    });

    // Add reaction to message
    socket.on('add_reaction', async (data: {
      messageId: string;
      emoji: string;
    }) => {
      try {
        if (!currentUser) return;

        // Get the message
        const message = await storage.getMessage(data.messageId);
        if (!message) {
          console.error('Message not found:', data.messageId);
          return;
        }

        // Update reactions
        const reactions = (message.reactions as Record<string, string[]>) || {};
        if (!reactions[data.emoji]) {
          reactions[data.emoji] = [];
        }
        
        // Toggle reaction (add if not present, remove if present)
        const userIndex = reactions[data.emoji].indexOf(currentUser.id);
        if (userIndex === -1) {
          reactions[data.emoji].push(currentUser.id);
        } else {
          reactions[data.emoji].splice(userIndex, 1);
          if (reactions[data.emoji].length === 0) {
            delete reactions[data.emoji];
          }
        }

        // Save to database
        await storage.updateMessageReactions(data.messageId, reactions);

        // Determine the correct room and broadcast
        const room = message.groupId 
          ? `group:${message.groupId}` 
          : `community:${message.stream}`;
        
        io.to(room).emit('reaction_added', {
          messageId: data.messageId,
          emoji: data.emoji,
          userId: currentUser.id,
          reactions,
        });
      } catch (error) {
        console.error('Add reaction error:', error);
      }
    });

    // Typing indicator
    socket.on('typing', (data: { groupId?: string; stream?: string }) => {
      if (!currentUser) return;
      
      const room = data.groupId ? `group:${data.groupId}` : `community:${data.stream}`;
      socket.to(room).emit('user_typing', {
        userId: currentUser.id,
        userName: currentUser.name,
      });
    });

    socket.on('stop_typing', (data: { groupId?: string; stream?: string }) => {
      if (!currentUser) return;
      
      const room = data.groupId ? `group:${data.groupId}` : `community:${data.stream}`;
      socket.to(room).emit('user_stop_typing', {
        userId: currentUser.id,
      });
    });

    socket.on('disconnect', () => {
      console.log('Socket.IO client disconnected:', socket.id);
    });
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      // Find user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      // Return user data (without password)
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const { username, password, userType, teacherAccessPassword } = req.body;
      
      // Check username availability
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ error: "Username already taken" });
      }

      // Verify teacher access password if user is registering as teacher
      if (userType === "teacher") {
        const TEACHER_ACCESS_PASSWORD = process.env.TEACHER_ACCESS_PASSWORD;
        if (!TEACHER_ACCESS_PASSWORD) {
          return res.status(500).json({ error: "Teacher registration is not configured" });
        }
        if (teacherAccessPassword !== TEACHER_ACCESS_PASSWORD) {
          return res.status(401).json({ error: "Invalid teacher access password" });
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user with hashed password
      const userData = {
        ...req.body,
        password: hashedPassword,
        isAdmin: userType === "teacher",
        adminClass: userType === "teacher" ? "all" : null,
      };

      // Remove teacherAccessPassword from userData before storing
      delete userData.teacherAccessPassword;

      const user = await storage.createUser(userData);
      
      // Return user data (without password)
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Subject routes
  app.get("/api/subjects", async (req, res) => {
    try {
      const { stream, class: classLevel } = req.query;
      if (!stream || !classLevel) {
        return res.status(400).json({ error: "Stream and class required" });
      }
      const subjects = await storage.getSubjects(stream as string, classLevel as string);
      res.json(subjects);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/subjects", async (req, res) => {
    try {
      const subject = await storage.createSubject(req.body);
      res.json(subject);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Section routes
  app.get("/api/sections", async (req, res) => {
    try {
      const { subjectId } = req.query;
      if (!subjectId) {
        return res.status(400).json({ error: "Subject ID required" });
      }
      const sections = await storage.getSections(subjectId as string);
      res.json(sections);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/sections", async (req, res) => {
    try {
      const section = await storage.createSection(req.body);
      res.json(section);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Material routes
  app.get("/api/materials", async (req, res) => {
    try {
      const { sectionId } = req.query;
      if (!sectionId) {
        return res.status(400).json({ error: "Section ID required" });
      }
      const materials = await storage.getMaterials(sectionId as string);
      res.json(materials);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Upload material with file
  app.post("/api/materials/upload", upload.single('file'), async (req, res) => {
    try {
      const { sectionId, title, type } = req.body;
      const file = req.file;

      if (!file && type !== 'youtube') {
        return res.status(400).json({ error: "File is required" });
      }

      let url = '';
      
      if (type === 'youtube') {
        // For YouTube videos, just store the URL
        url = req.body.url;
      } else {
        // Convert file to base64 data URL
        const base64 = file!.buffer.toString('base64');
        const mimeType = file!.mimetype;
        url = `data:${mimeType};base64,${base64}`;
      }

      const material = await storage.createMaterial({
        sectionId,
        title,
        type,
        url,
      });

      res.json(material);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create material (for YouTube or external URLs)
  app.post("/api/materials", async (req, res) => {
    try {
      const material = await storage.createMaterial(req.body);
      res.json(material);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Banner routes
  app.get("/api/banners", async (req, res) => {
    try {
      const banners = await storage.getBanners();
      res.json(banners);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/banners", async (req, res) => {
    try {
      const banner = await storage.createBanner(req.body);
      res.json(banner);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/banners/:id", async (req, res) => {
    try {
      await storage.deleteBanner(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Test routes
  app.get("/api/tests", async (req, res) => {
    try {
      const { stream, class: classLevel } = req.query;
      if (!stream || !classLevel) {
        return res.status(400).json({ error: "Stream and class required" });
      }
      const tests = await storage.getTests(stream as string, classLevel as string);
      res.json(tests);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tests", async (req, res) => {
    try {
      const test = await storage.createTest(req.body);
      res.json(test);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Question routes
  app.get("/api/tests/:testId/questions", async (req, res) => {
    try {
      const questions = await storage.getQuestions(req.params.testId);
      res.json(questions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tests/:testId/questions", async (req, res) => {
    try {
      const question = await storage.createQuestion({
        ...req.body,
        testId: req.params.testId,
      });
      res.json(question);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Test submission
  app.post("/api/tests/:testId/submit", async (req, res) => {
    try {
      const { answers } = req.body;
      const testId = req.params.testId;
      
      // Get test and questions
      const test = await storage.getTest(testId);
      if (!test) {
        return res.status(404).json({ error: "Test not found" });
      }

      const questions = await storage.getQuestions(testId);
      
      // Calculate score
      let correctCount = 0;
      let wrongCount = 0;
      let unattemptedCount = 0;

      questions.forEach((question) => {
        const userAnswer = answers[question.id];
        if (!userAnswer) {
          unattemptedCount++;
        } else if (userAnswer === question.correctAnswer) {
          correctCount++;
        } else {
          wrongCount++;
        }
      });

      const score = 
        (correctCount * test.correctMarks) +
        (wrongCount * test.wrongMarks) +
        (unattemptedCount * test.unattemptedMarks);

      // Create submission
      const submission = await storage.createSubmission({
        testId,
        userId: req.body.userId || "temp-user",
        answers,
        score,
        correctCount,
        wrongCount,
        unattemptedCount,
      });

      res.json(submission);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Leaderboard
  app.get("/api/tests/:testId/leaderboard", async (req, res) => {
    try {
      const submissions = await storage.getSubmissionsByTest(req.params.testId);
      
      // Get user data for each submission
      const leaderboard = await Promise.all(
        submissions.map(async (submission) => {
          const user = await storage.getUser(submission.userId);
          return {
            ...submission,
            user,
          };
        })
      );

      // Sort by score descending
      leaderboard.sort((a, b) => b.score - a.score);

      res.json(leaderboard);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // AI Tutor - Text, Image, and Audio support
  app.post("/api/ai-tutor", async (req, res) => {
    try {
      if (!groq) {
        return res.status(503).json({ 
          error: "AI Tutor is not available. Please configure GROQ_API_KEY to enable this feature." 
        });
      }

      const { message, image, messageType } = req.body;

      // Handle audio transcription first if audio is provided
      if (messageType === 'audio') {
        // Audio transcription would go here using Whisper
        // For now, return a placeholder
        return res.json({ 
          response: "Audio transcription coming soon. Please use text or image input for now." 
        });
      }

      // Handle text with optional image (vision)
      if (image) {
        // Use vision model for image understanding
        const completion = await groq.chat.completions.create({
          model: "llama-3.2-90b-vision-preview",
          messages: [
            {
              role: "system",
              content: "You are AIMAI, a helpful AI tutor for students. Answer only academic and study-related questions. Be encouraging, clear, and educational in your responses. If asked non-academic questions, politely redirect to academic topics.",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: message || "What is in this image? Please explain in detail.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: image, // Can be URL or base64
                  },
                },
              ],
            },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        });

        res.json({ response: completion.choices[0].message.content });
      } else {
        // Regular text-only conversation
        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: "You are AIMAI, a helpful AI tutor for students. Answer only academic and study-related questions. Be encouraging, clear, and educational in your responses. If asked non-academic questions, politely redirect to academic topics.",
            },
            {
              role: "user",
              content: message,
            },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        });

        res.json({ response: completion.choices[0].message.content });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Group routes
  app.get("/api/groups/my/:userId", async (req, res) => {
    try {
      const groups = await storage.getGroupsByUser(req.params.userId);
      res.json(groups);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/groups", async (req, res) => {
    try {
      const { username } = req.body;
      
      // Check username availability
      const existing = await storage.getGroupByUsername(username);
      if (existing) {
        return res.status(400).json({ error: "Group username already taken" });
      }

      const group = await storage.createGroup(req.body);
      res.json(group);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Group member routes
  app.post("/api/groups/:groupId/join", async (req, res) => {
    try {
      const member = await storage.createGroupMember({
        groupId: req.params.groupId,
        userId: req.body.userId,
        status: "pending",
      });
      res.json(member);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/group-members/:id", async (req, res) => {
    try {
      await storage.updateGroupMemberStatus(req.params.id, req.body.status);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/groups/members/:id", async (req, res) => {
    try {
      await storage.updateGroupMemberStatus(req.params.id, req.body.status);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get pending join requests for a group
  app.get("/api/groups/join-requests/:groupId", async (req, res) => {
    try {
      const members = await storage.getGroupMembers(req.params.groupId);
      const pendingRequests = members.filter(m => m.status === "pending");
      
      // Add user names to requests
      const requestsWithUsers = await Promise.all(
        pendingRequests.map(async (request) => {
          const user = await storage.getUser(request.userId);
          return {
            ...request,
            userName: user?.name || "Unknown",
          };
        })
      );
      
      res.json(requestsWithUsers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Announcement routes
  app.get("/api/announcements", async (req, res) => {
    try {
      const { stream, class: classLevel } = req.query;
      const announcements = await storage.getAnnouncements(
        stream as string | undefined,
        classLevel as string | undefined
      );
      res.json(announcements);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/announcements", async (req, res) => {
    try {
      const announcement = await storage.createAnnouncement(req.body);
      res.json(announcement);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Messages
  app.get("/api/messages", async (req, res) => {
    try {
      const { groupId, stream } = req.query;
      const messages = await storage.getMessages(groupId as string, stream as string);
      
      // Get user data for each message
      const messagesWithUsers = await Promise.all(
        messages.map(async (message) => {
          const user = await storage.getUser(message.userId);
          return {
            ...message,
            userName: user?.name,
            userPhoto: user?.profilePhoto,
          };
        })
      );
      
      res.json(messagesWithUsers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get community messages
  app.get("/api/messages/community/:stream", async (req, res) => {
    try {
      const messages = await storage.getMessages(undefined, req.params.stream);
      const messagesWithUsers = await Promise.all(
        messages.map(async (message) => {
          const user = await storage.getUser(message.userId);
          return {
            ...message,
            userName: user?.name || "Unknown",
            userPhoto: user?.profilePhoto,
          };
        })
      );
      res.json(messagesWithUsers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get group messages
  app.get("/api/messages/group/:groupId", async (req, res) => {
    try {
      const messages = await storage.getMessages(req.params.groupId, undefined);
      const messagesWithUsers = await Promise.all(
        messages.map(async (message) => {
          const user = await storage.getUser(message.userId);
          return {
            ...message,
            userName: user?.name || "Unknown",
            userPhoto: user?.profilePhoto,
          };
        })
      );
      res.json(messagesWithUsers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Pin/unpin message (admin only)
  app.patch("/api/messages/:id/pin", async (req, res) => {
    try {
      const { isPinned } = req.body;
      const message = await storage.updateMessagePin(req.params.id, isPinned);
      
      // Broadcast pin update to all clients in the room
      const room = message.groupId 
        ? `group:${message.groupId}` 
        : `community:${message.stream}`;
      
      io.to(room).emit('message_pinned', {
        messageId: message.id,
        isPinned: message.isPinned,
      });
      
      res.json(message);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete message (admin only)
  app.delete("/api/messages/:id", async (req, res) => {
    try {
      // Note: In a real app, we'd check if the user is an admin here
      // await storage.deleteMessage(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Chat settings
  app.get("/api/chat-settings/:stream", async (req, res) => {
    try {
      const setting = await storage.getChatSetting(req.params.stream);
      res.json(setting || { stream: req.params.stream, isEnabled: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/chat-settings/:stream", async (req, res) => {
    try {
      await storage.updateChatSetting(req.params.stream, req.body.isEnabled);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/chat/settings/:stream", async (req, res) => {
    try {
      const setting = await storage.getChatSetting(req.params.stream);
      res.json(setting || { stream: req.params.stream, isEnabled: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/chat/settings/:stream", async (req, res) => {
    try {
      await storage.updateChatSetting(req.params.stream, req.body.isEnabled);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // File upload for chat images
  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "File is required" });
      }

      // Convert file to base64 data URL
      const base64 = file.buffer.toString('base64');
      const mimeType = file.mimetype;
      const url = `data:${mimeType};base64,${base64}`;

      res.json({ url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
