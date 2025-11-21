import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import OpenAI from "openai";
import type { User } from "@shared/schema";

// Initialize OpenAI client only if API key is provided
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

interface WebSocketClient extends WebSocket {
  userId?: string;
  stream?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time chat
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const clients = new Map<string, WebSocketClient>();

  wss.on('connection', (ws: WebSocketClient) => {
    console.log('WebSocket client connected');

    ws.on('message', async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'auth') {
          ws.userId = message.userId;
          const user = await storage.getUser(message.userId);
          if (user) {
            ws.stream = user.stream;
            clients.set(message.userId, ws);
          }
        }

        if (message.type === 'sendMessage' && ws.userId) {
          const user = await storage.getUser(ws.userId);
          if (!user) return;

          const newMessage = await storage.createMessage({
            groupId: message.groupId || undefined,
            stream: message.stream || undefined,
            userId: ws.userId,
            content: message.content,
            type: 'text',
            isPinned: false,
          });

          // Broadcast to relevant clients
          const messageWithUser = {
            type: 'message',
            message: {
              ...newMessage,
              userName: user.name,
              userPhoto: user.profilePhoto,
            },
          };

          clients.forEach((client, userId) => {
            if (client.readyState === WebSocket.OPEN) {
              if (message.groupId) {
                // Send to group members
                client.send(JSON.stringify(messageWithUser));
              } else if (message.stream && client.stream === message.stream) {
                // Send to community chat
                client.send(JSON.stringify(messageWithUser));
              }
            }
          });
        }
      } catch (error) {
        console.error('WebSocket error:', error);
      }
    });

    ws.on('close', () => {
      if (ws.userId) {
        clients.delete(ws.userId);
      }
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

  app.post("/api/users", async (req, res) => {
    try {
      const { username } = req.body;
      
      // Check username availability
      const existing = await storage.getUserByUsername(username);
      if (existing) {
        return res.status(400).json({ error: "Username already taken" });
      }

      const user = await storage.createUser(req.body);
      res.json(user);
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

  // AI Tutor
  app.post("/api/ai-tutor", async (req, res) => {
    try {
      if (!openai) {
        return res.status(503).json({ 
          error: "AI Tutor is not available. Please configure OPENAI_API_KEY to enable this feature." 
        });
      }

      const { message } = req.body;

      const completion = await openai.chat.completions.create({
        model: "gpt-5",
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
      });

      res.json({ response: completion.choices[0].message.content });
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

  return httpServer;
}
