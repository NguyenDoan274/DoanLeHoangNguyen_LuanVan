// LMS Database - Online Learning Platform
// Stack: Next.js + NestJS + PostgreSQL + Mux
// Removed: refresh_tokens, certificates

Enum user_role {
  STUDENT
  INSTRUCTOR
  ADMIN
}

Enum user_status {
  ACTIVE
  INACTIVE
  BANNED
}

Enum instructor_request_status {
  PENDING
  APPROVED
  REJECTED
}

Enum course_level {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}

Enum course_status {
  DRAFT
  PUBLISHED
  HIDDEN
  ARCHIVED
}

Enum mux_status {
  NO_VIDEO
  PROCESSING
  READY
  ERRORED
}

Enum enrollment_status {
  ACTIVE
  COMPLETED
  CANCELLED
}

Enum question_type {
  MULTIPLE_CHOICE
  ESSAY
}

Enum attempt_status {
  IN_PROGRESS
  SUBMITTED
  GRADED
}

Table users {
  id uuid [primary key]
  full_name varchar [not null]
  email varchar [not null, unique]
  password_hash text [not null]
  avatar_url text
  role user_role [not null, default: 'STUDENT']
  status user_status [not null, default: 'ACTIVE']
  created_at timestamp
  updated_at timestamp
}

Table instructor_requests {
  id uuid [primary key]
  user_id uuid [not null]
  status instructor_request_status [not null, default: 'PENDING']
  reason text
  experience text
  expertise varchar
  admin_note text
  reviewed_by uuid
  reviewed_at timestamp
  created_at timestamp
  updated_at timestamp
}

Table categories {
  id uuid [primary key]
  name varchar [not null]
  slug varchar [not null, unique]
  description text
  created_at timestamp
  updated_at timestamp
}

Table courses {
  id uuid [primary key]
  instructor_id uuid [not null]
  category_id uuid
  title varchar [not null]
  slug varchar [not null, unique]
  short_description text
  description text
  thumbnail_url text
  level course_level [not null, default: 'BEGINNER']
  status course_status [not null, default: 'DRAFT']
  price decimal(10,2) [default: 0]
  created_at timestamp
  updated_at timestamp
}

Table course_sections {
  id uuid [primary key]
  course_id uuid [not null]
  title varchar [not null]
  description text
  order_index integer [not null]
  created_at timestamp
  updated_at timestamp
}

Table lessons {
  id uuid [primary key]
  section_id uuid [not null]
  title varchar [not null]
  content text
  order_index integer [not null]
  is_preview boolean [default: false]

  // Mux video information
  mux_upload_id varchar
  mux_asset_id varchar
  mux_playback_id varchar
  mux_status mux_status [default: 'NO_VIDEO']
  duration_sec integer

  created_at timestamp
  updated_at timestamp
}

Table lesson_resources {
  id uuid [primary key]
  lesson_id uuid [not null]
  file_name varchar [not null]
  file_url text [not null]
  file_type varchar
  file_size bigint
  created_at timestamp
}

Table enrollments {
  id uuid [primary key]
  student_id uuid [not null]
  course_id uuid [not null]
  status enrollment_status [not null, default: 'ACTIVE']
  enrolled_at timestamp
  completed_at timestamp

  indexes {
    (student_id, course_id) [unique]
  }
}

Table lesson_progress {
  id uuid [primary key]
  enrollment_id uuid [not null]
  lesson_id uuid [not null]
  is_completed boolean [default: false]
  watched_seconds integer [default: 0]
  completed_at timestamp
  updated_at timestamp

  indexes {
    (enrollment_id, lesson_id) [unique]
  }
}

Table quizzes {
  id uuid [primary key]
  course_id uuid [not null]
  lesson_id uuid
  title varchar [not null]
  description text
  time_limit_minutes integer
  passing_score decimal(5,2) [default: 0]
  max_attempts integer [default: 1]
  created_at timestamp
  updated_at timestamp
}

Table questions {
  id uuid [primary key]
  quiz_id uuid [not null]
  question_text text [not null]
  question_type question_type [not null]
  score decimal(5,2) [default: 1]
  order_index integer [not null]
  created_at timestamp
  updated_at timestamp
}

Table question_options {
  id uuid [primary key]
  question_id uuid [not null]
  option_text text [not null]
  is_correct boolean [default: false]
  order_index integer [not null]
}

Table quiz_attempts {
  id uuid [primary key]
  quiz_id uuid [not null]
  student_id uuid [not null]
  enrollment_id uuid [not null]
  status attempt_status [not null, default: 'IN_PROGRESS']
  total_score decimal(5,2) [default: 0]
  is_passed boolean [default: false]
  started_at timestamp
  submitted_at timestamp
  graded_at timestamp
}

Table quiz_answers {
  id uuid [primary key]
  attempt_id uuid [not null]
  question_id uuid [not null]
  selected_option_id uuid
  essay_answer text
  score decimal(5,2) [default: 0]
  feedback text
  graded_by uuid
  graded_at timestamp
  created_at timestamp
  updated_at timestamp
}


// Relationships

Ref: instructor_requests.user_id > users.id
Ref: instructor_requests.reviewed_by > users.id

Ref: courses.instructor_id > users.id
Ref: courses.category_id > categories.id

Ref: course_sections.course_id > courses.id

Ref: lessons.section_id > course_sections.id

Ref: lesson_resources.lesson_id > lessons.id

Ref: enrollments.student_id > users.id
Ref: enrollments.course_id > courses.id

Ref: lesson_progress.enrollment_id > enrollments.id
Ref: lesson_progress.lesson_id > lessons.id

Ref: quizzes.course_id > courses.id
Ref: quizzes.lesson_id > lessons.id

Ref: questions.quiz_id > quizzes.id

Ref: question_options.question_id > questions.id

Ref: quiz_attempts.quiz_id > quizzes.id
Ref: quiz_attempts.student_id > users.id
Ref: quiz_attempts.enrollment_id > enrollments.id

Ref: quiz_answers.attempt_id > quiz_attempts.id
Ref: quiz_answers.question_id > questions.id
Ref: quiz_answers.selected_option_id > question_options.id
Ref: quiz_answers.graded_by > users.id