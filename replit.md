# Sänsa Learn - Educational Platform

## Overview

Sänsa Learn is a full-stack educational web application designed for students in Classes 5-12, NEET, and JEE streams. The platform provides comprehensive learning tools including online tests, AI tutoring, real-time chat, study materials, and user profile management. Built with a modern tech stack, it emphasizes accessibility, bilingual support (Hindi/English), and mobile-first responsive design.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build Tools**
- React with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR (Hot Module Replacement)
- Wouter for lightweight client-side routing instead of React Router

**UI Component System**
- shadcn/ui component library based on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Design system follows Material Design principles inspired by Google Classroom
- Typography: Inter (UI/body) and Poppins (headings) from Google Fonts
- Custom CSS variables for theming with light/dark mode support

**State Management**
- React Context API for global state (UserContext, LanguageContext)
- TanStack Query (React Query) for server state management and caching
- Local storage for persistence of user data and language preferences

**Form Handling**
- React Hook Form with Zod schema validation
- @hookform/resolvers for integration between the two libraries

### Backend Architecture

**Server Framework**
- Express.js with TypeScript running on Node.js
- Separate development (index-dev.ts) and production (index-prod.ts) entry points
- Vite middleware integration in development for seamless full-stack experience

**Real-time Communication**
- WebSocket implementation using the 'ws' library
- Custom WebSocket server mounted on HTTP server at '/ws' path
- Real-time chat with message broadcasting to groups and stream-based channels
- Client authentication on WebSocket connection with userId tracking

**API Architecture**
- RESTful API endpoints under '/api' prefix
- JSON request/response format
- Custom logging middleware for request/response tracking
- Error handling with appropriate HTTP status codes

### Data Storage

**Database**
- PostgreSQL as the primary database (via DATABASE_URL environment variable)
- Neon Database serverless driver (@neondatabase/serverless) for database connectivity
- Drizzle ORM for type-safe database queries and migrations
- Database schema defined in shared/schema.ts for type sharing between client and server

**Data Models**
- Users: profile information, stream (School/NEET/JEE), class, language preferences, admin roles
- Subjects & Sections: hierarchical content organization by stream and class
- Materials: study resources linked to sections
- Tests & Questions: online assessment system with question banks
- Submissions: test results with scoring and leaderboard support
- Groups & Messages: chat functionality with group-based and stream-based messaging
- Banners: featured content/announcements
- Announcements: admin-created notifications
- Chat Settings: profanity filtering and moderation controls

**Storage Strategy**
- In-memory storage abstraction layer (storage.ts) for development/testing
- Production uses PostgreSQL with Drizzle ORM
- All timestamps use PostgreSQL's timestamp type with defaultNow()
- UUIDs for primary keys using gen_random_uuid()

### Authentication & Authorization

**Current Implementation**
- Password-based authentication with bcrypt hashing (10 rounds)
- User type selection during registration: Student or Teacher
- Teacher verification using TEACHER_ACCESS_PASSWORD environment secret
- Welcome page with "Create Account" and "Login" options
- Secure password handling with UserPublic type to prevent password exposure

**Security Implementation**
- UserPublic type: Excludes password field from all client-facing responses
- toPublicUser helper function: Strips passwords from API responses
- All user-facing endpoints sanitized: registration, login, user fetch, user update, leaderboard
- Message endpoints only expose userName and userPhoto fields
- Failed login shows WhatsApp contact message (9153021229)

**Role-Based Access Control**
- User types: student or teacher (userType field)
- isAdmin flag automatically set for teacher accounts
- Admin users have adminClass field set to "all" for managing content across all classes
- Teachers can create tests, subjects, and manage content for their assigned classes

**Authentication Flow**
- New users: Welcome page → Create Account (with password + user type selection)
- Existing users: Welcome page → Login (username + password)
- Teacher registration requires valid TEACHER_ACCESS_PASSWORD from Replit Secrets
- User data stored in UserContext (client-side) and PostgreSQL (server-side)
- No session tokens or JWT currently implemented (stateless authentication)

### External Dependencies

**AI Integration**
- OpenAI API for AI Tutor functionality
- Using GPT-5 model (as per code comments: "newest OpenAI model released August 7, 2025")
- Environment variable: OPENAI_API_KEY required for AI features
- Streaming responses not currently implemented but structure supports it

**Third-Party UI Libraries**
- Radix UI primitives for accessible component foundations
- Lucide React for iconography
- date-fns for date manipulation
- Embla Carousel for content carousels
- class-variance-authority (CVA) for component variant management
- cmdk for command palette functionality

**Development Tools**
- Replit-specific plugins for development environment integration
- ESBuild for production bundling
- PostCSS with Autoprefixer for CSS processing
- TypeScript with strict mode enabled

**Bilingual Support**
- i18n implementation in lib/i18n.ts
- Translation objects for English and Hindi
- Language switching stored in localStorage
- Context-based translation function (t()) throughout components

**Content Moderation**
- Basic profanity filter in lib/badWords.ts
- Real-time message filtering before sending to WebSocket
- Expandable word list for content safety