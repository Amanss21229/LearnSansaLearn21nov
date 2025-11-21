CREATE TABLE "announcements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"stream" text,
	"class" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "banners" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_url" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stream" text NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	CONSTRAINT "chat_settings_stream_unique" UNIQUE("stream")
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"username" text NOT NULL,
	"creator_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "groups_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "materials" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" varchar NOT NULL,
	"title" text NOT NULL,
	"type" text NOT NULL,
	"url" text NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" varchar,
	"stream" text,
	"user_id" varchar NOT NULL,
	"content" text NOT NULL,
	"type" text DEFAULT 'text' NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"reactions" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"test_id" varchar NOT NULL,
	"question_number" integer NOT NULL,
	"question_text" text NOT NULL,
	"option_a" text NOT NULL,
	"option_b" text NOT NULL,
	"option_c" text NOT NULL,
	"option_d" text NOT NULL,
	"correct_answer" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sections" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_id" varchar NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"stream" text NOT NULL,
	"class" text NOT NULL,
	"icon" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"test_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"answers" jsonb NOT NULL,
	"score" integer NOT NULL,
	"correct_count" integer NOT NULL,
	"wrong_count" integer NOT NULL,
	"unattempted_count" integer NOT NULL,
	"rank" integer,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" varchar,
	"name" text NOT NULL,
	"duration" integer DEFAULT 180 NOT NULL,
	"stream" text NOT NULL,
	"class" text NOT NULL,
	"total_questions" integer DEFAULT 0 NOT NULL,
	"correct_marks" integer DEFAULT 4 NOT NULL,
	"wrong_marks" integer DEFAULT -1 NOT NULL,
	"unattempted_marks" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"username" text NOT NULL,
	"gender" text NOT NULL,
	"stream" text NOT NULL,
	"class" text NOT NULL,
	"phone" text,
	"email" text,
	"profile_photo" text,
	"language" text DEFAULT 'english' NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"admin_class" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
