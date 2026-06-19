// LMS Database - Online Learning Platform
// Stack: Next.js + NestJS + PostgreSQL + Mux
// Features: Global Coupons, Direct Promotions (Course/Category), Orders, Payments & Course Groups (Roadmaps)

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
  PENDING_PAYMENT
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

Enum discount_type {
  PERCENTAGE
  FIXED_AMOUNT
}

Enum coupon_status {
  ACTIVE
  INACTIVE
  EXPIRED
}

Enum order_status {
  PENDING
  COMPLETED
  FAILED
  CANCELLED
}

Enum payment_status {
  PENDING
  SUCCESS
  FAILED
}

Table users {
  id uuid [pk]
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
  id uuid [pk]
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
  id uuid [pk]
  name varchar [not null]
  slug varchar [not null, unique]
  description text
  created_at timestamp
  updated_at timestamp
}

// Bảng lưu thông tin Nhóm khóa học (Ví dụ: Nhóm mục tiêu TOEIC 450, TOEIC 650)
Table course_groups {
  id uuid [pk]
   owner_id uuid [not null]
  category_id uuid [not null]                  // Thuộc về danh mục nào (Ví dụ: Tiếng Anh)
  title varchar [not null]                     // Tên nhóm (Ví dụ: Lộ trình mục tiêu TOEIC 450)
  slug varchar [not null, unique]
  description text
  order_index integer [not null, default: 0]   // Thứ tự hiển thị của nhóm trong danh mục
  created_at timestamp
  updated_at timestamp
}

// Bảng trung gian định nghĩa các khóa học nằm trong nhóm nào và thứ tự học (Roadmap)
Table course_group_items {
  course_group_id uuid [not null]
  course_id uuid [not null]
  order_index integer [not null, default: 0]   // Thứ tự học của khóa học trong nhóm này (Khóa 1 -> Khóa 2)
  
  indexes {
    (course_group_id, course_id) [pk]
  }
}

Table coupons {
  id uuid [pk]
  code varchar [not null, unique]
  discount_type discount_type [not null]
  discount_value decimal(10,2) [not null]
  start_date timestamp
  end_date timestamp
  usage_limit integer
  used_count integer [default: 0]
  status coupon_status [not null, default: 'ACTIVE']
  created_by uuid [not null]
  created_at timestamp
  updated_at timestamp
}

Table promotions {
  id uuid [pk]
  name varchar [not null]
  discount_percentage decimal(5,2) [not null]
  start_date timestamp [not null]
  end_date timestamp [not null]
  is_active boolean [default: true]
  created_at timestamp
  updated_at timestamp
}

Table promotion_courses {
  promotion_id uuid [not null]
  course_id uuid [not null]
  
  indexes {
    (promotion_id, course_id) [pk]
  }
}

Table promotion_categories {
  promotion_id uuid [not null]
  category_id uuid [not null]
  
  indexes {
    (promotion_id, category_id) [pk]
  }
}

Table courses {
  id uuid [pk]
  instructor_id uuid [not null]
  category_id uuid
  title varchar [not null]
  slug varchar [not null, unique]
  short_description text
  description text
  thumbnail_url text
  level course_level [not null, default: 'BEGINNER']
  status course_status [not null, default: 'DRAFT']
  price decimal(10,2) [not null, default: 0]
  created_at timestamp
  updated_at timestamp
}

Table course_sections {
  id uuid [pk]
  course_id uuid [not null]
  title varchar [not null]
  description text
  order_index integer [not null]
  created_at timestamp
  updated_at timestamp
}

Table lessons {
  id uuid [pk]
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
  id uuid [pk]
  lesson_id uuid [not null]
  file_name varchar [not null]
  file_url text [not null]
  file_type varchar
  file_size bigint
  created_at timestamp
}

Table orders {
  id uuid [pk]
  student_id uuid [not null]
  course_id uuid [not null]
  coupon_id uuid [null]
  promotion_id uuid [null]
  base_price decimal(10,2) [not null]
  promotion_discount decimal(10,2) [default: 0]
  coupon_discount decimal(10,2) [default: 0]
  final_price decimal(10,2) [not null]
  status order_status [not null, default: 'PENDING']
  created_at timestamp
  updated_at timestamp
}

Table payments {
  id uuid [pk]
  order_id uuid [not null]
  payment_method varchar [not null]
  transaction_reference varchar [unique]
  amount decimal(10,2) [not null]
  status payment_status [not null, default: 'PENDING']
  paid_at timestamp
  created_at timestamp
}

Table enrollments {
  id uuid [pk]
  student_id uuid [not null]
  course_id uuid [not null]
  order_id uuid [null]
  status enrollment_status [not null, default: 'PENDING_PAYMENT']
  enrolled_at timestamp
  completed_at timestamp

  indexes {
    (student_id, course_id) [unique]
  }
}

Table lesson_progress {
  id uuid [pk]
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
  id uuid [pk]
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
  id uuid [pk]
  quiz_id uuid [not null]
  question_text text [not null]
  question_type question_type [not null]
  score decimal(5,2) [default: 1]
  order_index integer [not null]
  created_at timestamp
  updated_at timestamp
}

Table question_options {
  id uuid [pk]
  question_id uuid [not null]
  option_text text [not null]
  is_correct boolean [default: false]
  order_index integer [not null]
}

Table quiz_attempts {
  id uuid [pk]
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
  id uuid [pk]
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

Ref: coupons.created_by > users.id

Ref: course_groups.category_id > categories.id
Ref: course_groups.owner_id > users.id
Ref: course_group_items.course_group_id > course_groups.id
Ref: course_group_items.course_id > courses.id

Ref: promotion_courses.promotion_id > promotions.id
Ref: promotion_courses.course_id > courses.id

Ref: promotion_categories.promotion_id > promotions.id
Ref: promotion_categories.category_id > categories.id

Ref: courses.instructor_id > users.id
Ref: courses.category_id > categories.id

Ref: course_sections.course_id > courses.id

Ref: lessons.section_id > course_sections.id

Ref: lesson_resources.lesson_id > lessons.id

Ref: orders.student_id > users.id
Ref: orders.course_id > courses.id
Ref: orders.coupon_id > coupons.id
Ref: orders.promotion_id > promotions.id

Ref: payments.order_id > orders.id

Ref: enrollments.student_id > users.id
Ref: enrollments.course_id > courses.id
Ref: enrollments.order_id > orders.id

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