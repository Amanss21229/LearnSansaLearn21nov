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
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  
  // Subjects
  getSubjects(stream: string, classLevel: string): Promise<Subject[]>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  
  // Sections
  getSections(subjectId: string): Promise<Section[]>;
  createSection(section: InsertSection): Promise<Section>;
  
  // Materials
  getMaterials(sectionId: string): Promise<Material[]>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  
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
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Chat Settings
  getChatSetting(stream: string): Promise<ChatSetting | undefined>;
  updateChatSetting(stream: string, isEnabled: boolean): Promise<void>;
  
  // Announcements
  getAnnouncements(stream?: string, classLevel?: string): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private subjects: Map<string, Subject>;
  private sections: Map<string, Section>;
  private materials: Map<string, Material>;
  private banners: Map<string, Banner>;
  private tests: Map<string, Test>;
  private questions: Map<string, Question>;
  private submissions: Map<string, Submission>;
  private groups: Map<string, Group>;
  private groupMembers: Map<string, GroupMember>;
  private messages: Map<string, Message>;
  private chatSettings: Map<string, ChatSetting>;
  private announcements: Map<string, Announcement>;

  constructor() {
    this.users = new Map();
    this.subjects = new Map();
    this.sections = new Map();
    this.materials = new Map();
    this.banners = new Map();
    this.tests = new Map();
    this.questions = new Map();
    this.submissions = new Map();
    this.groups = new Map();
    this.groupMembers = new Map();
    this.messages = new Map();
    this.chatSettings = new Map();
    this.announcements = new Map();
    
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Initialize default subjects for different streams
    const defaultSubjects = [
      { name: "Hindi", stream: "School", class: "5-12", icon: "book" },
      { name: "English", stream: "School", class: "5-12", icon: "book" },
      { name: "Mathematics", stream: "School", class: "5-12", icon: "calculator" },
      { name: "Science", stream: "School", class: "5-12", icon: "flask" },
      { name: "Social Studies", stream: "School", class: "5-12", icon: "globe" },
      { name: "Physics", stream: "NEET", class: "11-12", icon: "atom" },
      { name: "Chemistry", stream: "NEET", class: "11-12", icon: "flask" },
      { name: "Botany", stream: "NEET", class: "11-12", icon: "leaf" },
      { name: "Zoology", stream: "NEET", class: "11-12", icon: "bug" },
      { name: "Physics", stream: "JEE", class: "11-12", icon: "atom" },
      { name: "Chemistry", stream: "JEE", class: "11-12", icon: "flask" },
      { name: "Mathematics", stream: "JEE", class: "11-12", icon: "calculator" },
    ];

    defaultSubjects.forEach(subject => {
      const id = randomUUID();
      this.subjects.set(id, {
        id,
        name: subject.name,
        stream: subject.stream,
        class: subject.class,
        icon: subject.icon,
        createdAt: new Date(),
      });
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date(),
      isAdmin: insertUser.isAdmin || false,
      adminClass: insertUser.adminClass || null,
      phone: insertUser.phone || null,
      email: insertUser.email || null,
      profilePhoto: insertUser.profilePhoto || null,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  // Subjects
  async getSubjects(stream: string, classLevel: string): Promise<Subject[]> {
    return Array.from(this.subjects.values()).filter(s => {
      if (s.stream !== stream) return false;
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
    const id = randomUUID();
    const newSubject: Subject = { ...subject, id, createdAt: new Date(), icon: subject.icon || null };
    this.subjects.set(id, newSubject);
    return newSubject;
  }

  // Sections
  async getSections(subjectId: string): Promise<Section[]> {
    return Array.from(this.sections.values()).filter(s => s.subjectId === subjectId);
  }

  async createSection(section: InsertSection): Promise<Section> {
    const id = randomUUID();
    const newSection: Section = { ...section, id, createdAt: new Date() };
    this.sections.set(id, newSection);
    return newSection;
  }

  // Materials
  async getMaterials(sectionId: string): Promise<Material[]> {
    return Array.from(this.materials.values()).filter(m => m.sectionId === sectionId);
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    const id = randomUUID();
    const newMaterial: Material = { ...material, id, viewCount: 0, createdAt: new Date() };
    this.materials.set(id, newMaterial);
    return newMaterial;
  }

  // Banners
  async getBanners(): Promise<Banner[]> {
    return Array.from(this.banners.values()).sort((a, b) => a.order - b.order);
  }

  async createBanner(banner: InsertBanner): Promise<Banner> {
    const id = randomUUID();
    const newBanner: Banner = { ...banner, id, createdAt: new Date() };
    this.banners.set(id, newBanner);
    return newBanner;
  }

  async deleteBanner(id: string): Promise<void> {
    this.banners.delete(id);
  }

  // Tests
  async getTests(stream: string, classLevel: string): Promise<Test[]> {
    return Array.from(this.tests.values()).filter(
      t => t.stream === stream && t.class === classLevel
    );
  }

  async getTest(id: string): Promise<Test | undefined> {
    return this.tests.get(id);
  }

  async createTest(test: InsertTest): Promise<Test> {
    const id = randomUUID();
    const newTest: Test = { ...test, id, totalQuestions: 0, sectionId: test.sectionId || null, createdAt: new Date() };
    this.tests.set(id, newTest);
    return newTest;
  }

  // Questions
  async getQuestions(testId: string): Promise<Question[]> {
    return Array.from(this.questions.values())
      .filter(q => q.testId === testId)
      .sort((a, b) => a.questionNumber - b.questionNumber);
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const id = randomUUID();
    const newQuestion: Question = { ...question, id };
    this.questions.set(id, newQuestion);
    
    // Update test total questions
    const test = this.tests.get(question.testId);
    if (test) {
      test.totalQuestions += 1;
      this.tests.set(test.id, test);
    }
    
    return newQuestion;
  }

  // Submissions
  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    const id = randomUUID();
    const newSubmission: Submission = { ...submission, id, rank: null, submittedAt: new Date() };
    this.submissions.set(id, newSubmission);
    
    // Calculate ranks for this test
    const testSubmissions = await this.getSubmissionsByTest(submission.testId);
    const sorted = testSubmissions.sort((a, b) => b.score - a.score);
    sorted.forEach((sub, index) => {
      this.updateSubmissionRank(sub.id, index + 1);
    });
    
    return this.submissions.get(id)!;
  }

  async getSubmissionsByTest(testId: string): Promise<Submission[]> {
    return Array.from(this.submissions.values()).filter(s => s.testId === testId);
  }

  async updateSubmissionRank(id: string, rank: number): Promise<void> {
    const submission = this.submissions.get(id);
    if (submission) {
      submission.rank = rank;
      this.submissions.set(id, submission);
    }
  }

  // Groups
  async getGroupsByUser(userId: string): Promise<Group[]> {
    const memberGroups = Array.from(this.groupMembers.values())
      .filter(m => m.userId === userId && m.status === "accepted")
      .map(m => m.groupId);
    
    return Array.from(this.groups.values()).filter(g => memberGroups.includes(g.id));
  }

  async getGroupByUsername(username: string): Promise<Group | undefined> {
    return Array.from(this.groups.values()).find(g => g.username === username);
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const id = randomUUID();
    const newGroup: Group = { ...group, id, createdAt: new Date() };
    this.groups.set(id, newGroup);
    
    // Auto-add creator as member
    await this.createGroupMember({
      groupId: id,
      userId: group.creatorId,
      status: "accepted",
    });
    
    return newGroup;
  }

  // Group Members
  async createGroupMember(member: InsertGroupMember): Promise<GroupMember> {
    const id = randomUUID();
    const newMember: GroupMember = { ...member, id, joinedAt: new Date() };
    this.groupMembers.set(id, newMember);
    return newMember;
  }

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    return Array.from(this.groupMembers.values()).filter(m => m.groupId === groupId);
  }

  async updateGroupMemberStatus(id: string, status: string): Promise<void> {
    const member = this.groupMembers.get(id);
    if (member) {
      member.status = status;
      this.groupMembers.set(id, member);
    }
  }

  // Messages
  async getMessages(groupId?: string, stream?: string): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(m => {
      if (groupId) return m.groupId === groupId;
      if (stream) return m.stream === stream;
      return false;
    }).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const newMessage: Message = { 
      ...message, 
      id, 
      groupId: message.groupId || null,
      stream: message.stream || null,
      createdAt: new Date(),
      reactions: message.reactions || {},
    };
    this.messages.set(id, newMessage);
    return newMessage;
  }

  // Chat Settings
  async getChatSetting(stream: string): Promise<ChatSetting | undefined> {
    return this.chatSettings.get(stream);
  }

  async updateChatSetting(stream: string, isEnabled: boolean): Promise<void> {
    const id = randomUUID();
    this.chatSettings.set(stream, { id, stream, isEnabled });
  }

  // Announcements
  async getAnnouncements(stream?: string, classLevel?: string): Promise<Announcement[]> {
    return Array.from(this.announcements.values())
      .filter(a => {
        if (stream && a.stream && a.stream !== stream) return false;
        if (classLevel && a.class && a.class !== classLevel) return false;
        return true;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const id = randomUUID();
    const newAnnouncement: Announcement = { 
      ...announcement, 
      id, 
      stream: announcement.stream || null,
      class: announcement.class || null,
      createdAt: new Date() 
    };
    this.announcements.set(id, newAnnouncement);
    return newAnnouncement;
  }
}

export const storage = new MemStorage();
