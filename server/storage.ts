import {
  type User, type InsertUser,
  type Subject, type InsertSubject,
  type Section, type InsertSection,
  type Material, type InsertMaterial,
  type Banner, type InsertBanner,
  type Test, type InsertTest,
  type Question, type InsertQuestion,
  type Submission, type InsertSubmission,
  type Group, type InsertGroup,
  type GroupMember, type InsertGroupMember,
  type Message, type InsertMessage,
  type ChatSetting, type InsertChatSetting,
  type Announcement, type InsertAnnouncement,
  users, subjects, sections, materials, banners, tests, questions,
  submissions, groups, groupMembers, messages, chatSettings, announcements,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, asc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  
  // Subjects
  getSubjects(stream: string, classLevel: string): Promise<Subject[]>;
  getAllSubjects(): Promise<Subject[]>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  deleteSubject(id: string): Promise<void>;
  
  // Sections
  getSections(subjectId: string): Promise<Section[]>;
  createSection(section: InsertSection): Promise<Section>;
  
  // Materials
  getMaterials(sectionId: string): Promise<Material[]>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  incrementMaterialView(id: string): Promise<void>;
  
  // Banners
  getBanners(): Promise<Banner[]>;
  createBanner(banner: InsertBanner): Promise<Banner>;
  deleteBanner(id: string): Promise<void>;
  
  // Tests
  getTests(stream: string, classLevel: string): Promise<Test[]>;
  getTest(id: string): Promise<Test | undefined>;
  createTest(test: InsertTest): Promise<Test>;
  
  // Questions
  getQuestions(testId: string): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  
  // Submissions
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getSubmissionsByTest(testId: string): Promise<Submission[]>;
  updateSubmissionRank(id: string, rank: number): Promise<void>;
  
  // Groups
  getGroupsByUser(userId: string): Promise<Group[]>;
  getGroupByUsername(username: string): Promise<Group | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  
  // Group Members
  createGroupMember(member: InsertGroupMember): Promise<GroupMember>;
  getGroupMembers(groupId: string): Promise<GroupMember[]>;
  updateGroupMemberStatus(id: string, status: string): Promise<void>;
  
  // Messages
  getMessages(groupId?: string, stream?: string): Promise<Message[]>;
  getMessage(id: string): Promise<Message | undefined>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessageReactions(id: string, reactions: any): Promise<Message>;
  updateMessagePin(id: string, isPinned: boolean): Promise<Message>;
  
  // Chat Settings
  getChatSetting(stream: string): Promise<ChatSetting | undefined>;
  updateChatSetting(stream: string, isEnabled: boolean): Promise<void>;
  
  // Announcements
  getAnnouncements(stream?: string, classLevel?: string): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
}

export class DbStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    if (!result[0]) throw new Error("User not found");
    return result[0];
  }

  // Subjects
  async getSubjects(stream: string, classLevel: string): Promise<Subject[]> {
    const result = await db.select().from(subjects).where(eq(subjects.stream, stream));
    
    // Filter by class level logic
    return result.filter(s => {
      const classRange = s.class.split('-');
      if (classRange.length === 2) {
        const [min, max] = classRange.map(Number);
        const level = Number(classLevel);
        return !isNaN(level) && level >= min && level <= max;
      }
      return s.class === classLevel || s.class.includes(classLevel);
    });
  }

  async createSubject(subject: InsertSubject): Promise<Subject> {
    const result = await db.insert(subjects).values(subject).returning();
    return result[0];
  }

  async deleteSubject(id: string): Promise<void> {
    await db.delete(subjects).where(eq(subjects.id, id));
  }

  async getAllSubjects(): Promise<Subject[]> {
    return db.select().from(subjects).orderBy(subjects.stream, subjects.class, subjects.name);
  }

  // Sections
  async getSections(subjectId: string): Promise<Section[]> {
    return db.select().from(sections).where(eq(sections.subjectId, subjectId));
  }

  async createSection(section: InsertSection): Promise<Section> {
    const result = await db.insert(sections).values(section).returning();
    return result[0];
  }

  // Materials
  async getMaterials(sectionId: string): Promise<Material[]> {
    return db.select().from(materials).where(eq(materials.sectionId, sectionId));
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    const result = await db.insert(materials).values(material).returning();
    return result[0];
  }

  async incrementMaterialView(id: string): Promise<void> {
    await db.update(materials)
      .set({ viewCount: sql`${materials.viewCount} + 1` })
      .where(eq(materials.id, id));
  }

  // Banners
  async getBanners(): Promise<Banner[]> {
    return db.select().from(banners).orderBy(asc(banners.order));
  }

  async createBanner(banner: InsertBanner): Promise<Banner> {
    const result = await db.insert(banners).values(banner).returning();
    return result[0];
  }

  async deleteBanner(id: string): Promise<void> {
    await db.delete(banners).where(eq(banners.id, id));
  }

  // Tests
  async getTests(stream: string, classLevel: string): Promise<Test[]> {
    return db.select().from(tests)
      .where(and(eq(tests.stream, stream), eq(tests.class, classLevel)));
  }

  async getTest(id: string): Promise<Test | undefined> {
    const result = await db.select().from(tests).where(eq(tests.id, id)).limit(1);
    return result[0];
  }

  async createTest(test: InsertTest): Promise<Test> {
    const result = await db.insert(tests).values(test).returning();
    return result[0];
  }

  // Questions
  async getQuestions(testId: string): Promise<Question[]> {
    return db.select().from(questions)
      .where(eq(questions.testId, testId))
      .orderBy(asc(questions.questionNumber));
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const result = await db.insert(questions).values(question).returning();
    
    // Update test total questions count
    await db.update(tests)
      .set({ totalQuestions: sql`${tests.totalQuestions} + 1` })
      .where(eq(tests.id, question.testId));
    
    return result[0];
  }

  // Submissions
  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    const result = await db.insert(submissions).values(submission).returning();
    
    // Calculate ranks for this test
    const testSubmissions = await this.getSubmissionsByTest(submission.testId);
    const sorted = testSubmissions.sort((a, b) => b.score - a.score);
    
    for (let i = 0; i < sorted.length; i++) {
      await this.updateSubmissionRank(sorted[i].id, i + 1);
    }
    
    // Return the updated submission with rank
    const updated = await db.select().from(submissions)
      .where(eq(submissions.id, result[0].id))
      .limit(1);
    return updated[0];
  }

  async getSubmissionsByTest(testId: string): Promise<Submission[]> {
    return db.select().from(submissions).where(eq(submissions.testId, testId));
  }

  async updateSubmissionRank(id: string, rank: number): Promise<void> {
    await db.update(submissions).set({ rank }).where(eq(submissions.id, id));
  }

  // Groups
  async getGroupsByUser(userId: string): Promise<Group[]> {
    const memberGroups = await db.select()
      .from(groupMembers)
      .where(and(eq(groupMembers.userId, userId), eq(groupMembers.status, "accepted")));
    
    const groupIds = memberGroups.map(m => m.groupId);
    if (groupIds.length === 0) return [];
    
    return db.select().from(groups)
      .where(sql`${groups.id} = ANY(${groupIds})`);
  }

  async getGroupByUsername(username: string): Promise<Group | undefined> {
    const result = await db.select().from(groups).where(eq(groups.username, username)).limit(1);
    return result[0];
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const result = await db.insert(groups).values(group).returning();
    
    // Auto-add creator as member
    await this.createGroupMember({
      groupId: result[0].id,
      userId: group.creatorId,
      status: "accepted",
    });
    
    return result[0];
  }

  // Group Members
  async createGroupMember(member: InsertGroupMember): Promise<GroupMember> {
    const result = await db.insert(groupMembers).values(member).returning();
    return result[0];
  }

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    return db.select().from(groupMembers).where(eq(groupMembers.groupId, groupId));
  }

  async updateGroupMemberStatus(id: string, status: string): Promise<void> {
    await db.update(groupMembers).set({ status }).where(eq(groupMembers.id, id));
  }

  // Messages
  async getMessages(groupId?: string, stream?: string): Promise<Message[]> {
    if (groupId) {
      return db.select().from(messages)
        .where(eq(messages.groupId, groupId))
        .orderBy(asc(messages.createdAt));
    }
    if (stream) {
      return db.select().from(messages)
        .where(eq(messages.stream, stream))
        .orderBy(asc(messages.createdAt));
    }
    return [];
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(message).returning();
    return result[0];
  }

  async getMessage(id: string): Promise<Message | undefined> {
    const result = await db.select().from(messages).where(eq(messages.id, id)).limit(1);
    return result[0];
  }

  async updateMessageReactions(id: string, reactions: any): Promise<Message> {
    const result = await db.update(messages)
      .set({ reactions })
      .where(eq(messages.id, id))
      .returning();
    if (!result[0]) throw new Error("Message not found");
    return result[0];
  }

  async updateMessagePin(id: string, isPinned: boolean): Promise<Message> {
    const result = await db.update(messages)
      .set({ isPinned })
      .where(eq(messages.id, id))
      .returning();
    if (!result[0]) throw new Error("Message not found");
    return result[0];
  }

  // Chat Settings
  async getChatSetting(stream: string): Promise<ChatSetting | undefined> {
    const result = await db.select().from(chatSettings)
      .where(eq(chatSettings.stream, stream))
      .limit(1);
    return result[0];
  }

  async updateChatSetting(stream: string, isEnabled: boolean): Promise<void> {
    const existing = await this.getChatSetting(stream);
    if (existing) {
      await db.update(chatSettings)
        .set({ isEnabled })
        .where(eq(chatSettings.stream, stream));
    } else {
      await db.insert(chatSettings).values({ stream, isEnabled });
    }
  }

  // Announcements
  async getAnnouncements(stream?: string, classLevel?: string): Promise<Announcement[]> {
    let query = db.select().from(announcements);
    
    if (stream || classLevel) {
      const conditions = [];
      if (stream) conditions.push(eq(announcements.stream, stream));
      if (classLevel) conditions.push(eq(announcements.class, classLevel));
      query = query.where(and(...conditions)) as any;
    }
    
    const result = await query.orderBy(desc(announcements.createdAt));
    return result;
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const result = await db.insert(announcements).values(announcement).returning();
    return result[0];
  }
}

export const storage = new DbStorage();
