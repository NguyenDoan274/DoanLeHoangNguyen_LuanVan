CREATE TYPE "user_role" AS ENUM (
  'STUDENT',
  'INSTRUCTOR',
  'ADMIN'
);

CREATE TYPE "user_status" AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'BANNED'
);

CREATE TYPE "instructor_request_status" AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED'
);

CREATE TYPE "course_level" AS ENUM (
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED'
);

CREATE TYPE "course_status" AS ENUM (
  'DRAFT',
  'PUBLISHED',
  'HIDDEN',
  'ARCHIVED'
);

CREATE TYPE "mux_status" AS ENUM (
  'NO_VIDEO',
  'PROCESSING',
  'READY',
  'ERRORED'
);

CREATE TYPE "enrollment_status" AS ENUM (
  'PENDING_PAYMENT',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED'
);

CREATE TYPE "question_type" AS ENUM (
  'MULTIPLE_CHOICE',
  'ESSAY'
);

CREATE TYPE "attempt_status" AS ENUM (
  'IN_PROGRESS',
  'SUBMITTED',
  'GRADED'
);

CREATE TYPE "discount_type" AS ENUM (
  'PERCENTAGE',
  'FIXED_AMOUNT'
);

CREATE TYPE "coupon_status" AS ENUM (
  'ACTIVE',
  'INACTIVE',
  'EXPIRED'
);

CREATE TYPE "order_status" AS ENUM (
  'PENDING',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
);

CREATE TYPE "payment_status" AS ENUM (
  'PENDING',
  'SUCCESS',
  'FAILED'
);

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY,
  "full_name" varchar NOT NULL,
  "email" varchar UNIQUE NOT NULL,
  "password_hash" text NOT NULL,
  "avatar_url" text,
  "role" user_role NOT NULL DEFAULT 'STUDENT',
  "status" user_status NOT NULL DEFAULT 'ACTIVE',
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "instructor_requests" (
  "id" uuid PRIMARY KEY,
  "user_id" uuid NOT NULL,
  "status" instructor_request_status NOT NULL DEFAULT 'PENDING',
  "reason" text,
  "experience" text,
  "expertise" varchar,
  "admin_note" text,
  "reviewed_by" uuid,
  "reviewed_at" timestamp,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "categories" (
  "id" uuid PRIMARY KEY,
  "name" varchar NOT NULL,
  "slug" varchar UNIQUE NOT NULL,
  "description" text,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "course_groups" (
  "id" uuid PRIMARY KEY,
  "owner_id" uuid NOT NULL,
  "category_id" uuid NOT NULL,
  "title" varchar NOT NULL,
  "slug" varchar UNIQUE NOT NULL,
  "description" text,
  "order_index" integer NOT NULL DEFAULT 0,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "course_group_items" (
  "course_group_id" uuid NOT NULL,
  "course_id" uuid NOT NULL,
  "order_index" integer NOT NULL DEFAULT 0,
  PRIMARY KEY ("course_group_id", "course_id")
);

CREATE TABLE "coupons" (
  "id" uuid PRIMARY KEY,
  "code" varchar UNIQUE NOT NULL,
  "discount_type" discount_type NOT NULL,
  "discount_value" decimal(10,2) NOT NULL,
  "start_date" timestamp,
  "end_date" timestamp,
  "usage_limit" integer,
  "used_count" integer DEFAULT 0,
  "status" coupon_status NOT NULL DEFAULT 'ACTIVE',
  "created_by" uuid NOT NULL,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "promotions" (
  "id" uuid PRIMARY KEY,
  "name" varchar NOT NULL,
  "discount_percentage" decimal(5,2) NOT NULL,
  "start_date" timestamp NOT NULL,
  "end_date" timestamp NOT NULL,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "promotion_courses" (
  "promotion_id" uuid NOT NULL,
  "course_id" uuid NOT NULL,
  PRIMARY KEY ("promotion_id", "course_id")
);

CREATE TABLE "promotion_categories" (
  "promotion_id" uuid NOT NULL,
  "category_id" uuid NOT NULL,
  PRIMARY KEY ("promotion_id", "category_id")
);

CREATE TABLE "courses" (
  "id" uuid PRIMARY KEY,
  "instructor_id" uuid NOT NULL,
  "category_id" uuid,
  "title" varchar NOT NULL,
  "slug" varchar UNIQUE NOT NULL,
  "short_description" text,
  "description" text,
  "thumbnail_url" text,
  "level" course_level NOT NULL DEFAULT 'BEGINNER',
  "status" course_status NOT NULL DEFAULT 'DRAFT',
  "price" decimal(10,2) NOT NULL DEFAULT 0,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "course_sections" (
  "id" uuid PRIMARY KEY,
  "course_id" uuid NOT NULL,
  "title" varchar NOT NULL,
  "description" text,
  "order_index" integer NOT NULL,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "lessons" (
  "id" uuid PRIMARY KEY,
  "section_id" uuid NOT NULL,
  "title" varchar NOT NULL,
  "content" text,
  "order_index" integer NOT NULL,
  "is_preview" boolean DEFAULT false,
  "mux_upload_id" varchar,
  "mux_asset_id" varchar,
  "mux_playback_id" varchar,
  "mux_status" mux_status DEFAULT 'NO_VIDEO',
  "duration_sec" integer,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "lesson_resources" (
  "id" uuid PRIMARY KEY,
  "lesson_id" uuid NOT NULL,
  "file_name" varchar NOT NULL,
  "file_url" text NOT NULL,
  "file_type" varchar,
  "file_size" bigint,
  "created_at" timestamp
);

CREATE TABLE "orders" (
  "id" uuid PRIMARY KEY,
  "student_id" uuid NOT NULL,
  "course_id" uuid NOT NULL,
  "coupon_id" uuid,
  "promotion_id" uuid,
  "base_price" decimal(10,2) NOT NULL,
  "promotion_discount" decimal(10,2) DEFAULT 0,
  "coupon_discount" decimal(10,2) DEFAULT 0,
  "final_price" decimal(10,2) NOT NULL,
  "status" order_status NOT NULL DEFAULT 'PENDING',
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "payments" (
  "id" uuid PRIMARY KEY,
  "order_id" uuid NOT NULL,
  "payment_method" varchar NOT NULL,
  "transaction_reference" varchar UNIQUE,
  "amount" decimal(10,2) NOT NULL,
  "status" payment_status NOT NULL DEFAULT 'PENDING',
  "paid_at" timestamp,
  "created_at" timestamp
);

CREATE TABLE "enrollments" (
  "id" uuid PRIMARY KEY,
  "student_id" uuid NOT NULL,
  "course_id" uuid NOT NULL,
  "order_id" uuid,
  "status" enrollment_status NOT NULL DEFAULT 'PENDING_PAYMENT',
  "enrolled_at" timestamp,
  "completed_at" timestamp
);

CREATE TABLE "lesson_progress" (
  "id" uuid PRIMARY KEY,
  "enrollment_id" uuid NOT NULL,
  "lesson_id" uuid NOT NULL,
  "is_completed" boolean DEFAULT false,
  "watched_seconds" integer DEFAULT 0,
  "completed_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "quizzes" (
  "id" uuid PRIMARY KEY,
  "course_id" uuid NOT NULL,
  "lesson_id" uuid,
  "title" varchar NOT NULL,
  "description" text,
  "time_limit_minutes" integer,
  "passing_score" decimal(5,2) DEFAULT 0,
  "max_attempts" integer DEFAULT 1,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "questions" (
  "id" uuid PRIMARY KEY,
  "quiz_id" uuid NOT NULL,
  "question_text" text NOT NULL,
  "question_type" question_type NOT NULL,
  "score" decimal(5,2) DEFAULT 1,
  "order_index" integer NOT NULL,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "question_options" (
  "id" uuid PRIMARY KEY,
  "question_id" uuid NOT NULL,
  "option_text" text NOT NULL,
  "is_correct" boolean DEFAULT false,
  "order_index" integer NOT NULL
);

CREATE TABLE "quiz_attempts" (
  "id" uuid PRIMARY KEY,
  "quiz_id" uuid NOT NULL,
  "student_id" uuid NOT NULL,
  "enrollment_id" uuid NOT NULL,
  "status" attempt_status NOT NULL DEFAULT 'IN_PROGRESS',
  "total_score" decimal(5,2) DEFAULT 0,
  "is_passed" boolean DEFAULT false,
  "started_at" timestamp,
  "submitted_at" timestamp,
  "graded_at" timestamp
);

CREATE TABLE "quiz_answers" (
  "id" uuid PRIMARY KEY,
  "attempt_id" uuid NOT NULL,
  "question_id" uuid NOT NULL,
  "selected_option_id" uuid,
  "essay_answer" text,
  "score" decimal(5,2) DEFAULT 0,
  "feedback" text,
  "graded_by" uuid,
  "graded_at" timestamp,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE UNIQUE INDEX ON "enrollments" ("student_id", "course_id");

CREATE UNIQUE INDEX ON "lesson_progress" ("enrollment_id", "lesson_id");

ALTER TABLE "instructor_requests" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "instructor_requests" ADD FOREIGN KEY ("reviewed_by") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "coupons" ADD FOREIGN KEY ("created_by") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "course_groups" ADD FOREIGN KEY ("category_id") REFERENCES "categories" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "course_groups" ADD FOREIGN KEY ("owner_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "course_group_items" ADD FOREIGN KEY ("course_group_id") REFERENCES "course_groups" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "course_group_items" ADD FOREIGN KEY ("course_id") REFERENCES "courses" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "promotion_courses" ADD FOREIGN KEY ("promotion_id") REFERENCES "promotions" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "promotion_courses" ADD FOREIGN KEY ("course_id") REFERENCES "courses" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "promotion_categories" ADD FOREIGN KEY ("promotion_id") REFERENCES "promotions" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "promotion_categories" ADD FOREIGN KEY ("category_id") REFERENCES "categories" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "courses" ADD FOREIGN KEY ("instructor_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "courses" ADD FOREIGN KEY ("category_id") REFERENCES "categories" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "course_sections" ADD FOREIGN KEY ("course_id") REFERENCES "courses" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "lessons" ADD FOREIGN KEY ("section_id") REFERENCES "course_sections" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "lesson_resources" ADD FOREIGN KEY ("lesson_id") REFERENCES "lessons" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "orders" ADD FOREIGN KEY ("student_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "orders" ADD FOREIGN KEY ("course_id") REFERENCES "courses" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "orders" ADD FOREIGN KEY ("coupon_id") REFERENCES "coupons" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "orders" ADD FOREIGN KEY ("promotion_id") REFERENCES "promotions" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "payments" ADD FOREIGN KEY ("order_id") REFERENCES "orders" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "enrollments" ADD FOREIGN KEY ("student_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "enrollments" ADD FOREIGN KEY ("course_id") REFERENCES "courses" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "enrollments" ADD FOREIGN KEY ("order_id") REFERENCES "orders" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "lesson_progress" ADD FOREIGN KEY ("enrollment_id") REFERENCES "enrollments" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "lesson_progress" ADD FOREIGN KEY ("lesson_id") REFERENCES "lessons" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "quizzes" ADD FOREIGN KEY ("course_id") REFERENCES "courses" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "quizzes" ADD FOREIGN KEY ("lesson_id") REFERENCES "lessons" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "questions" ADD FOREIGN KEY ("quiz_id") REFERENCES "quizzes" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "question_options" ADD FOREIGN KEY ("question_id") REFERENCES "questions" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "quiz_attempts" ADD FOREIGN KEY ("quiz_id") REFERENCES "quizzes" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "quiz_attempts" ADD FOREIGN KEY ("student_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "quiz_attempts" ADD FOREIGN KEY ("enrollment_id") REFERENCES "enrollments" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "quiz_answers" ADD FOREIGN KEY ("attempt_id") REFERENCES "quiz_attempts" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "quiz_answers" ADD FOREIGN KEY ("question_id") REFERENCES "questions" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "quiz_answers" ADD FOREIGN KEY ("selected_option_id") REFERENCES "question_options" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "quiz_answers" ADD FOREIGN KEY ("graded_by") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;
