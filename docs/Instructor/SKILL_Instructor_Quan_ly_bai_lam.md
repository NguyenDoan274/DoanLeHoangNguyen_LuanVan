# SKILL.md — Use-case: Quản lý bài làm

## 1. Mục tiêu use-case

Use-case **Quản lý bài làm** cho phép giảng viên xem bài làm của học viên, chấm câu tự luận, nhập nhận xét và cập nhật điểm.

Hệ thống sử dụng:

```txt
Frontend: Next.js
Backend: NestJS
Database: PostgreSQL
ORM: Prisma
Auth: JWT access token
Video: Mux
Storage tài liệu: S3/R2 hoặc storage tương đương
```

Trong phạm vi tài liệu này, hệ thống **không sử dụng bảng refresh_tokens**. JWT access token được dùng để xác thực request; khi đăng xuất, frontend xóa token/cookie đang lưu.

---

## 2. Actor tham gia

| Actor | Mô tả |
|---|---|
| Instructor | Giảng viên đã được duyệt role |
| LMS System | Backend xử lý xác thực, nghiệp vụ và dữ liệu |

Actor chính của use-case này:

```txt
Instructor
```

---

## 3. Phạm vi chức năng

Use-case **Quản lý bài làm** bao gồm:

```txt
Xem danh sách attempt
Lọc bài cần chấm
Xem câu trả lời tự luận
Nhập điểm câu tự luận
Nhập feedback
Tính lại total_score
Cập nhật trạng thái GRADED
Xem lịch sử chấm
```

Không bao gồm:

```txt
Học viên làm quiz
Tạo câu hỏi
```

Các chức năng không bao gồm sẽ được tách sang use-case khác để báo cáo rõ ràng và dễ triển khai theo module.

---

## 4. Tiền điều kiện và hậu điều kiện

### 4.1. Xem bài làm cần chấm

| Mục | Nội dung |
|---|---|
| Tiền điều kiện | Actor đã đăng nhập nếu chức năng yêu cầu xác thực; tài khoản phải ở trạng thái `ACTIVE`; dữ liệu liên quan phải tồn tại trong database. |
| Hậu điều kiện | Hệ thống hoàn tất luồng **Xem bài làm cần chấm**, dữ liệu được cập nhật trong bảng liên quan và frontend hiển thị trạng thái mới. |

### 4.2. Chấm câu tự luận

| Mục | Nội dung |
|---|---|
| Tiền điều kiện | Actor đã đăng nhập nếu chức năng yêu cầu xác thực; tài khoản phải ở trạng thái `ACTIVE`; dữ liệu liên quan phải tồn tại trong database. |
| Hậu điều kiện | Hệ thống hoàn tất luồng **Chấm câu tự luận**, dữ liệu được cập nhật trong bảng liên quan và frontend hiển thị trạng thái mới. |

### 4.3. Hoàn tất điểm attempt

| Mục | Nội dung |
|---|---|
| Tiền điều kiện | Actor đã đăng nhập nếu chức năng yêu cầu xác thực; tài khoản phải ở trạng thái `ACTIVE`; dữ liệu liên quan phải tồn tại trong database. |
| Hậu điều kiện | Hệ thống hoàn tất luồng **Hoàn tất điểm attempt**, dữ liệu được cập nhật trong bảng liên quan và frontend hiển thị trạng thái mới. |

---

## 5. Database liên quan

Use-case này chủ yếu sử dụng các bảng: `users`, `courses`, `quizzes`, `questions`, `quiz_attempts`, `quiz_answers`, `enrollments`.

### Bảng `users`
```dbml
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
```

Quan hệ chính:
- users 1 - N courses thông qua courses.instructor_id
- users 1 - N enrollments thông qua enrollments.student_id
- users 1 - N quiz_attempts thông qua quiz_attempts.student_id

### Bảng `courses`
```dbml
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
```

Quan hệ chính:
- users 1 - N courses
- categories 1 - N courses
- courses 1 - N course_sections
- courses 1 - N enrollments
- courses 1 - N quizzes

### Bảng `quizzes`
```dbml
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
```

Quan hệ chính:
- courses 1 - N quizzes
- lessons 1 - N quizzes nếu lesson_id khác null
- quizzes 1 - N questions
- quizzes 1 - N quiz_attempts

### Bảng `questions`
```dbml
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
```

Quan hệ chính:
- quizzes 1 - N questions
- questions 1 - N question_options
- questions 1 - N quiz_answers

### Bảng `quiz_attempts`
```dbml
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
```

Quan hệ chính:
- quizzes 1 - N quiz_attempts
- users 1 - N quiz_attempts
- quiz_attempts 1 - N quiz_answers

### Bảng `quiz_answers`
```dbml
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
```

Quan hệ chính:
- quiz_attempts 1 - N quiz_answers
- questions 1 - N quiz_answers
- question_options 1 - N quiz_answers

### Bảng `enrollments`
```dbml
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
```

Quan hệ chính:
- users 1 - N enrollments
- courses 1 - N enrollments
- enrollments 1 - N lesson_progress
- enrollments 1 - N quiz_attempts

### Enum liên quan

```dbml
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

Enum course_status {
  DRAFT
  PUBLISHED
  HIDDEN
  ARCHIVED
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
```

### Ý nghĩa nghiệp vụ dữ liệu

- `users`: phục vụ lưu trữ/truy vấn dữ liệu cho use-case **Quản lý bài làm**.
- `courses`: phục vụ lưu trữ/truy vấn dữ liệu cho use-case **Quản lý bài làm**.
- `quizzes`: phục vụ lưu trữ/truy vấn dữ liệu cho use-case **Quản lý bài làm**.
- `questions`: phục vụ lưu trữ/truy vấn dữ liệu cho use-case **Quản lý bài làm**.
- `quiz_attempts`: phục vụ lưu trữ/truy vấn dữ liệu cho use-case **Quản lý bài làm**.
- `quiz_answers`: phục vụ lưu trữ/truy vấn dữ liệu cho use-case **Quản lý bài làm**.
- `enrollments`: phục vụ lưu trữ/truy vấn dữ liệu cho use-case **Quản lý bài làm**.

---

## 6. Kiến trúc xử lý

### 6.1. Tổng quan kiến trúc

```txt
Next.js Frontend
   |
   | HTTP Request + JWT
   v
NestJS Backend
   |
   | Submissions/AttemptsModule / Guards / Services
   v
Prisma ORM
   |
   v
PostgreSQL Database
```

### 6.2. Các module NestJS liên quan

```txt
src/
├── auth/
│   ├── guards/jwt-auth.guard.ts
│   ├── guards/roles.guard.ts
│   └── strategies/jwt.strategy.ts
├── submissions_attempts/
│   ├── submissions_attempts.module.ts
│   ├── submissions_attempts.controller.ts
│   ├── submissions_attempts.service.ts
│   └── dto/
│       ├── create.dto.ts
│       ├── update.dto.ts
│       └── query.dto.ts
└── prisma/
    ├── prisma.module.ts
    └── prisma.service.ts
```

### 6.3. Trách nhiệm từng thành phần

| Thành phần | Trách nhiệm |
|---|---|
| `submissions_attempts.controller.ts` | Nhận request, đọc user từ JWT, gọi service và trả response |
| `submissions_attempts.service.ts` | Xử lý nghiệp vụ chính của use-case **Quản lý bài làm** |
| `JwtAuthGuard` | Xác thực access token |
| `RolesGuard` | Kiểm tra role `STUDENT`, `INSTRUCTOR`, `ADMIN` |
| `PrismaService` | Thao tác dữ liệu PostgreSQL |
| `DTO` | Validate dữ liệu đầu vào |

---

## 7. API design

### 7.1. Danh sách bài làm
```http
GET /instructor/submissions
Authorization: Bearer access_token
```

Request gợi ý:
```json
// Không bắt buộc body. Có thể dùng query string để search/filter/pagination.
```

Response thành công:
```json
{
  "message": "Danh sách bài làm thành công",
  "data": {
    "id": "uuid"
  }
}
```

### 7.2. Chi tiết bài làm
```http
GET /instructor/submissions/:attemptId
Authorization: Bearer access_token
```

Request gợi ý:
```json
// Không bắt buộc body. Có thể dùng query string để search/filter/pagination.
```

Response thành công:
```json
{
  "message": "Chi tiết bài làm thành công",
  "data": {
    "id": "uuid"
  }
}
```

### 7.3. Chấm một câu tự luận
```http
PATCH /answers/:answerId/grade
Authorization: Bearer access_token
```

Request gợi ý:
```json
{
  "exampleField": "exampleValue",
  "note": "Chấm một câu tự luận"
}
```

Response thành công:
```json
{
  "message": "Chấm một câu tự luận thành công",
  "data": {
    "id": "uuid"
  }
}
```

### 7.4. Hoàn tất chấm attempt
```http
PATCH /attempts/:attemptId/finalize-grade
Authorization: Bearer access_token
```

Request gợi ý:
```json
{
  "exampleField": "exampleValue",
  "note": "Hoàn tất chấm attempt"
}
```

Response thành công:
```json
{
  "message": "Hoàn tất chấm attempt thành công",
  "data": {
    "id": "uuid"
  }
}
```

### 7.5. Bài làm theo quiz
```http
GET /instructor/quizzes/:quizId/submissions
Authorization: Bearer access_token
```

Request gợi ý:
```json
// Không bắt buộc body. Có thể dùng query string để search/filter/pagination.
```

Response thành công:
```json
{
  "message": "Bài làm theo quiz thành công",
  "data": {
    "id": "uuid"
  }
}
```

---

## 8. Data flow

### 8.1. Data flow — Xem bài làm cần chấm

```txt
Instructor mở màn hình /instructor/submissions
→ Next.js kiểm tra trạng thái đăng nhập
→ Next.js gửi GET /instructor/submissions
→ NestJS JwtAuthGuard xác thực access token
→ RolesGuard kiểm tra quyền phù hợp với use-case
→ Submissions/AttemptsController nhận request
→ Submissions/AttemptsService kiểm tra dữ liệu đầu vào
→ Service kiểm tra quan hệ dữ liệu và quyền sở hữu nếu có
→ Service gọi Prisma để thao tác bảng chính: quiz_answers
→ PostgreSQL trả kết quả
→ Service chuẩn hóa response DTO
→ Controller trả response về frontend
→ Frontend cập nhật UI, hiển thị thông báo và chuyển bước tiếp theo
```

### 8.2. Data flow — Chấm câu tự luận

```txt
Instructor mở màn hình /instructor/submissions
→ Next.js kiểm tra trạng thái đăng nhập
→ Next.js gửi GET /instructor/submissions/:attemptId
→ NestJS JwtAuthGuard xác thực access token
→ RolesGuard kiểm tra quyền phù hợp với use-case
→ Submissions/AttemptsController nhận request
→ Submissions/AttemptsService kiểm tra dữ liệu đầu vào
→ Service kiểm tra quan hệ dữ liệu và quyền sở hữu nếu có
→ Service gọi Prisma để thao tác bảng chính: quiz_answers
→ PostgreSQL trả kết quả
→ Service chuẩn hóa response DTO
→ Controller trả response về frontend
→ Frontend cập nhật UI, hiển thị thông báo và chuyển bước tiếp theo
```

### 8.3. Data flow — Hoàn tất điểm attempt

```txt
Instructor mở màn hình /instructor/submissions
→ Next.js kiểm tra trạng thái đăng nhập
→ Next.js gửi PATCH /answers/:answerId/grade
→ NestJS JwtAuthGuard xác thực access token
→ RolesGuard kiểm tra quyền phù hợp với use-case
→ Submissions/AttemptsController nhận request
→ Submissions/AttemptsService kiểm tra dữ liệu đầu vào
→ Service kiểm tra quan hệ dữ liệu và quyền sở hữu nếu có
→ Service gọi Prisma để thao tác bảng chính: quiz_answers
→ PostgreSQL trả kết quả
→ Service chuẩn hóa response DTO
→ Controller trả response về frontend
→ Frontend cập nhật UI, hiển thị thông báo và chuyển bước tiếp theo
```

### 8.99. Quy tắc xử lý dữ liệu chung

```txt
Luôn lấy userId và role từ JWT, không lấy role từ body request.
Luôn kiểm tra bản ghi tồn tại trước khi cập nhật/xóa.
Với dữ liệu thuộc khóa học, phải kiểm tra quyền sở hữu của instructor nếu actor là Instructor.
Với dữ liệu của học viên, phải kiểm tra enrollment nếu chức năng yêu cầu đã đăng ký khóa học.
Không trả dữ liệu nhạy cảm như password_hash về frontend.
Chuẩn hóa response DTO để frontend dễ xử lý trạng thái loading/error/success.
```

---

## 9. Sequence diagram

### 9.1. Sequence — Xem bài làm cần chấm

```plantuml
@startuml
actor "Instructor" as Actor
participant "Next.js FE" as FE
participant "JwtAuthGuard" as Guard
participant "Submissions/AttemptsController" as Controller
participant "Submissions/AttemptsService" as Service
participant "PrismaService" as Prisma
database "PostgreSQL" as DB

Actor -> FE: Thực hiện thao tác: Xem bài làm cần chấm
FE -> Guard: GET /instructor/submissions + JWT
Guard -> Guard: Verify JWT và kiểm tra role

alt Token không hợp lệ hoặc hết hạn
    Guard --> FE: 401 Unauthorized
    FE --> Actor: Yêu cầu đăng nhập lại
else Token hợp lệ
    Guard -> Controller: Cho phép request
    Controller -> Service: Xử lý nghiệp vụ Xem bài làm cần chấm
    Service -> Prisma: Truy vấn/cập nhật dữ liệu liên quan
    Prisma -> DB: SELECT/INSERT/UPDATE
    DB --> Prisma: Kết quả
    Prisma --> Service: Dữ liệu đã xử lý

    alt Không đủ quyền hoặc dữ liệu không hợp lệ
        Service --> Controller: Throw Exception
        Controller --> FE: 400/403/404
        FE --> Actor: Hiển thị thông báo lỗi
    else Thành công
        Service --> Controller: Response DTO
        Controller --> FE: 200/201 OK
        FE --> Actor: Hiển thị kết quả thành công
    end
end
@enduml
```

### 9.2. Sequence — Chấm câu tự luận

```plantuml
@startuml
actor "Instructor" as Actor
participant "Next.js FE" as FE
participant "JwtAuthGuard" as Guard
participant "Submissions/AttemptsController" as Controller
participant "Submissions/AttemptsService" as Service
participant "PrismaService" as Prisma
database "PostgreSQL" as DB

Actor -> FE: Thực hiện thao tác: Chấm câu tự luận
FE -> Guard: GET /instructor/submissions/:attemptId + JWT
Guard -> Guard: Verify JWT và kiểm tra role

alt Token không hợp lệ hoặc hết hạn
    Guard --> FE: 401 Unauthorized
    FE --> Actor: Yêu cầu đăng nhập lại
else Token hợp lệ
    Guard -> Controller: Cho phép request
    Controller -> Service: Xử lý nghiệp vụ Chấm câu tự luận
    Service -> Prisma: Truy vấn/cập nhật dữ liệu liên quan
    Prisma -> DB: SELECT/INSERT/UPDATE
    DB --> Prisma: Kết quả
    Prisma --> Service: Dữ liệu đã xử lý

    alt Không đủ quyền hoặc dữ liệu không hợp lệ
        Service --> Controller: Throw Exception
        Controller --> FE: 400/403/404
        FE --> Actor: Hiển thị thông báo lỗi
    else Thành công
        Service --> Controller: Response DTO
        Controller --> FE: 200/201 OK
        FE --> Actor: Hiển thị kết quả thành công
    end
end
@enduml
```

### 9.3. Sequence — Hoàn tất điểm attempt

```plantuml
@startuml
actor "Instructor" as Actor
participant "Next.js FE" as FE
participant "JwtAuthGuard" as Guard
participant "Submissions/AttemptsController" as Controller
participant "Submissions/AttemptsService" as Service
participant "PrismaService" as Prisma
database "PostgreSQL" as DB

Actor -> FE: Thực hiện thao tác: Hoàn tất điểm attempt
FE -> Guard: PATCH /answers/:answerId/grade + JWT
Guard -> Guard: Verify JWT và kiểm tra role

alt Token không hợp lệ hoặc hết hạn
    Guard --> FE: 401 Unauthorized
    FE --> Actor: Yêu cầu đăng nhập lại
else Token hợp lệ
    Guard -> Controller: Cho phép request
    Controller -> Service: Xử lý nghiệp vụ Hoàn tất điểm attempt
    Service -> Prisma: Truy vấn/cập nhật dữ liệu liên quan
    Prisma -> DB: SELECT/INSERT/UPDATE
    DB --> Prisma: Kết quả
    Prisma --> Service: Dữ liệu đã xử lý

    alt Không đủ quyền hoặc dữ liệu không hợp lệ
        Service --> Controller: Throw Exception
        Controller --> FE: 400/403/404
        FE --> Actor: Hiển thị thông báo lỗi
    else Thành công
        Service --> Controller: Response DTO
        Controller --> FE: 200/201 OK
        FE --> Actor: Hiển thị kết quả thành công
    end
end
@enduml
```

---

## 10. Activity flow

### 10.1. Activity flow — Xem bài làm cần chấm

```txt
Bắt đầu
→ Actor chọn chức năng: Xem bài làm cần chấm
→ Hệ thống kiểm tra đăng nhập
   ├── Chưa đăng nhập → chuyển đến /login
   └── Đã đăng nhập
       → Kiểm tra role
          ├── Không đủ quyền → báo lỗi 403
          └── Đủ quyền
              → Validate dữ liệu đầu vào
                 ├── Không hợp lệ → báo lỗi 400
                 └── Hợp lệ
                     → Kiểm tra dữ liệu liên quan
                        ├── Không tồn tại → báo lỗi 404
                        └── Tồn tại
                            → Xử lý nghiệp vụ
                            → Cập nhật/truy vấn database
                            → Trả response
                            → Frontend cập nhật giao diện
Kết thúc
```

### 10.2. Activity flow — Chấm câu tự luận

```txt
Bắt đầu
→ Actor chọn chức năng: Chấm câu tự luận
→ Hệ thống kiểm tra đăng nhập
   ├── Chưa đăng nhập → chuyển đến /login
   └── Đã đăng nhập
       → Kiểm tra role
          ├── Không đủ quyền → báo lỗi 403
          └── Đủ quyền
              → Validate dữ liệu đầu vào
                 ├── Không hợp lệ → báo lỗi 400
                 └── Hợp lệ
                     → Kiểm tra dữ liệu liên quan
                        ├── Không tồn tại → báo lỗi 404
                        └── Tồn tại
                            → Xử lý nghiệp vụ
                            → Cập nhật/truy vấn database
                            → Trả response
                            → Frontend cập nhật giao diện
Kết thúc
```

### 10.3. Activity flow — Hoàn tất điểm attempt

```txt
Bắt đầu
→ Actor chọn chức năng: Hoàn tất điểm attempt
→ Hệ thống kiểm tra đăng nhập
   ├── Chưa đăng nhập → chuyển đến /login
   └── Đã đăng nhập
       → Kiểm tra role
          ├── Không đủ quyền → báo lỗi 403
          └── Đủ quyền
              → Validate dữ liệu đầu vào
                 ├── Không hợp lệ → báo lỗi 400
                 └── Hợp lệ
                     → Kiểm tra dữ liệu liên quan
                        ├── Không tồn tại → báo lỗi 404
                        └── Tồn tại
                            → Xử lý nghiệp vụ
                            → Cập nhật/truy vấn database
                            → Trả response
                            → Frontend cập nhật giao diện
Kết thúc
```

---

## 11. Kiểm tra phân quyền

### 11.1. JWT payload

```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "STUDENT|INSTRUCTOR|ADMIN"
}
```

### 11.2. Quyền truy cập API

| API | Quyền truy cập | Ghi chú |
|---|---|---|
| `GET /instructor/submissions` | INSTRUCTOR | Danh sách bài làm |
| `GET /instructor/submissions/:attemptId` | INSTRUCTOR | Chi tiết bài làm |
| `PATCH /answers/:answerId/grade` | INSTRUCTOR | Chấm một câu tự luận |
| `PATCH /attempts/:attemptId/finalize-grade` | INSTRUCTOR | Hoàn tất chấm attempt |
| `GET /instructor/quizzes/:quizId/submissions` | INSTRUCTOR | Bài làm theo quiz |

### 11.3. Quy tắc quan trọng

```txt
Không tin tưởng role gửi từ frontend.
Không cho user thao tác dữ liệu của user khác nếu không phải admin.
Instructor chỉ được thao tác dữ liệu thuộc khóa học do mình tạo.
Student chỉ được xem dữ liệu học tập khi đã enrollment hoặc bài học cho preview.
Admin không duyệt khóa học; admin chỉ quản trị tài khoản, yêu cầu giảng viên, danh mục và thống kê.
```

---

## 12. Validation rules

### 12.1. DTO chung

```txt
id: phải là UUID hợp lệ
page: số nguyên >= 1 nếu có phân trang
limit: số nguyên trong khoảng 1 - 100
search: chuỗi, trim khoảng trắng, giới hạn 255 ký tự
status: phải thuộc enum tương ứng
created_at/updated_at: không cho client tự sửa nếu không cần thiết
```

### 12.2. Validation theo chức năng

- Xem danh sách attempt: kiểm tra dữ liệu bắt buộc, quyền truy cập, trạng thái bản ghi và quan hệ khóa ngoại trước khi xử lý.
- Lọc bài cần chấm: kiểm tra dữ liệu bắt buộc, quyền truy cập, trạng thái bản ghi và quan hệ khóa ngoại trước khi xử lý.
- Xem câu trả lời tự luận: kiểm tra dữ liệu bắt buộc, quyền truy cập, trạng thái bản ghi và quan hệ khóa ngoại trước khi xử lý.
- Nhập điểm câu tự luận: kiểm tra dữ liệu bắt buộc, quyền truy cập, trạng thái bản ghi và quan hệ khóa ngoại trước khi xử lý.
- Nhập feedback: kiểm tra dữ liệu bắt buộc, quyền truy cập, trạng thái bản ghi và quan hệ khóa ngoại trước khi xử lý.
- Tính lại total_score: kiểm tra dữ liệu bắt buộc, quyền truy cập, trạng thái bản ghi và quan hệ khóa ngoại trước khi xử lý.
- Cập nhật trạng thái GRADED: kiểm tra dữ liệu bắt buộc, quyền truy cập, trạng thái bản ghi và quan hệ khóa ngoại trước khi xử lý.
- Xem lịch sử chấm: kiểm tra dữ liệu bắt buộc, quyền truy cập, trạng thái bản ghi và quan hệ khóa ngoại trước khi xử lý.

### 12.3. Ràng buộc database cần lưu ý

```txt
Email user phải unique.
Slug khóa học/danh mục phải unique nếu có dùng slug.
Enrollment nên unique theo student_id + course_id.
Lesson progress nên unique theo enrollment_id + lesson_id.
Không xóa dữ liệu cha nếu đang có dữ liệu con quan trọng, trừ khi đã thiết kế cascade rõ ràng.
```

---

## 13. Error handling

| Trường hợp | HTTP Status | Message gợi ý |
|---|---|---|
| Chưa đăng nhập | 401 | Vui lòng đăng nhập để tiếp tục |
| Token không hợp lệ hoặc hết hạn | 401 | Phiên đăng nhập đã hết hạn |
| Không đủ quyền | 403 | Bạn không có quyền thực hiện chức năng này |
| Dữ liệu không hợp lệ | 400 | Dữ liệu đầu vào không hợp lệ |
| Bản ghi không tồn tại | 404 | Không tìm thấy dữ liệu |
| Dữ liệu bị trùng | 409 | Dữ liệu đã tồn tại |
| Không đúng trạng thái nghiệp vụ | 409 | Không thể thực hiện thao tác ở trạng thái hiện tại |
| Lỗi hệ thống | 500 | Có lỗi xảy ra, vui lòng thử lại sau |

---

## 14. Bảo mật

Các yêu cầu bảo mật tối thiểu:

```txt
Luôn xác thực bằng JwtAuthGuard với API private.
Kiểm tra role bằng RolesGuard.
Không trả password_hash hoặc thông tin nhạy cảm về frontend.
Validate toàn bộ DTO bằng class-validator hoặc cơ chế tương đương.
Rate limit các API dễ bị spam nếu cần.
Ghi log lỗi ở backend nhưng không trả stack trace cho frontend.
Với file upload, kiểm tra mime type, extension và file size.
Với dữ liệu thuộc instructor, bắt buộc kiểm tra ownership.
Với dữ liệu học tập của student, bắt buộc kiểm tra enrollment.
```

---

## 15. Prototype user flow

### 15.1. Flow — Xem bài làm cần chấm

```txt
/instructor/submissions
→ Người dùng chọn chức năng: Xem bài làm cần chấm
→ Frontend hiển thị form/danh sách tương ứng
→ Người dùng nhập dữ liệu hoặc chọn thao tác
→ Bấm xác nhận
→ Frontend gọi API backend
→ Backend kiểm tra token, role, dữ liệu
→ Backend xử lý nghiệp vụ
→ Frontend nhận response
→ UI cập nhật dữ liệu mới và hiển thị toast thông báo
```

### 15.2. Flow — Chấm câu tự luận

```txt
/instructor/submissions
→ Người dùng chọn chức năng: Chấm câu tự luận
→ Frontend hiển thị form/danh sách tương ứng
→ Người dùng nhập dữ liệu hoặc chọn thao tác
→ Bấm xác nhận
→ Frontend gọi API backend
→ Backend kiểm tra token, role, dữ liệu
→ Backend xử lý nghiệp vụ
→ Frontend nhận response
→ UI cập nhật dữ liệu mới và hiển thị toast thông báo
```

### 15.3. Flow — Hoàn tất điểm attempt

```txt
/instructor/submissions
→ Người dùng chọn chức năng: Hoàn tất điểm attempt
→ Frontend hiển thị form/danh sách tương ứng
→ Người dùng nhập dữ liệu hoặc chọn thao tác
→ Bấm xác nhận
→ Frontend gọi API backend
→ Backend kiểm tra token, role, dữ liệu
→ Backend xử lý nghiệp vụ
→ Frontend nhận response
→ UI cập nhật dữ liệu mới và hiển thị toast thông báo
```

---

## 16. Gợi ý màn hình giao diện

### 16.1. Màn hình danh sách/tổng quan

```txt
+--------------------------------------------------------------+
| Header / Sidebar                                             |
+--------------------------------------------------------------+
| Use-case: Quản lý bài làm                               |
| Route: /instructor/submissions                            |
+--------------------------------------------------------------+
| Bộ lọc / tìm kiếm / trạng thái                               |
| [Search________________] [Filter] [Sort]                     |
+--------------------------------------------------------------+
| Bảng hoặc danh sách dữ liệu                                  |
| - Dòng dữ liệu 1                                             |
| - Dòng dữ liệu 2                                             |
| - Dòng dữ liệu 3                                             |
+--------------------------------------------------------------+
| Pagination / Action buttons                                  |
+--------------------------------------------------------------+
```

### 16.2. Màn hình chi tiết/xử lý

```txt
+--------------------------------------------------------------+
| Tiêu đề chức năng                                            |
+--------------------------------------------------------------+
| Thông tin chính                                               |
| Label 1: value                                                |
| Label 2: value                                                |
| Label 3: value                                                |
+--------------------------------------------------------------+
| Form nhập liệu hoặc thao tác                                  |
| [Input 1____________________]                                 |
| [Input 2____________________]                                 |
| [Cancel] [Save/Submit]                                        |
+--------------------------------------------------------------+
```

### 16.3. Trạng thái UI cần có

```txt
Loading: hiển thị skeleton hoặc spinner
Empty: hiển thị thông báo chưa có dữ liệu
Error: hiển thị message từ backend
Success: hiển thị toast thành công
Forbidden: điều hướng hoặc báo không đủ quyền
```

---

## 17. Test cases cơ bản

| Mã test | Nội dung | Kết quả mong đợi |
|---|---|---|
| TC01 | Truy cập API khi chưa đăng nhập | Trả 401 Unauthorized |
| TC02 | Truy cập với role không phù hợp | Trả 403 Forbidden |
| TC03 | Gửi dữ liệu thiếu trường bắt buộc | Trả 400 Bad Request |
| TC04 | Gửi ID không tồn tại | Trả 404 Not Found |
| TC05 | Thực hiện thao tác hợp lệ | Trả 200/201 và dữ liệu đúng |
| TC06 | Kiểm tra chức năng: Xem danh sách attempt | Hệ thống xử lý đúng nghiệp vụ và cập nhật dữ liệu chính xác |
| TC07 | Kiểm tra chức năng: Lọc bài cần chấm | Hệ thống xử lý đúng nghiệp vụ và cập nhật dữ liệu chính xác |
| TC08 | Kiểm tra chức năng: Xem câu trả lời tự luận | Hệ thống xử lý đúng nghiệp vụ và cập nhật dữ liệu chính xác |
| TC09 | Kiểm tra chức năng: Nhập điểm câu tự luận | Hệ thống xử lý đúng nghiệp vụ và cập nhật dữ liệu chính xác |
| TC10 | Kiểm tra chức năng: Nhập feedback | Hệ thống xử lý đúng nghiệp vụ và cập nhật dữ liệu chính xác |
| TC11 | Kiểm tra chức năng: Tính lại total_score | Hệ thống xử lý đúng nghiệp vụ và cập nhật dữ liệu chính xác |
| TC12 | Kiểm tra chức năng: Cập nhật trạng thái GRADED | Hệ thống xử lý đúng nghiệp vụ và cập nhật dữ liệu chính xác |
| TC13 | Kiểm tra chức năng: Xem lịch sử chấm | Hệ thống xử lý đúng nghiệp vụ và cập nhật dữ liệu chính xác |
| TC14 | Kiểm tra edge case 1 của use-case | Không phát sinh lỗi ngoài dự kiến, message rõ ràng |
| TC15 | Kiểm tra edge case 1 của use-case | Không phát sinh lỗi ngoài dự kiến, message rõ ràng |
| TC16 | Kiểm tra edge case 1 của use-case | Không phát sinh lỗi ngoài dự kiến, message rõ ràng |
| TC17 | Kiểm tra edge case 1 của use-case | Không phát sinh lỗi ngoài dự kiến, message rõ ràng |
| TC18 | Kiểm tra edge case 1 của use-case | Không phát sinh lỗi ngoài dự kiến, message rõ ràng |
| TC19 | Kiểm tra edge case 1 của use-case | Không phát sinh lỗi ngoài dự kiến, message rõ ràng |
| TC20 | Kiểm tra edge case 1 của use-case | Không phát sinh lỗi ngoài dự kiến, message rõ ràng |

---

## 18. Checklist triển khai backend

- [ ] Tạo module/controller/service/dto
- [ ] Khai báo route API
- [ ] Bảo vệ route bằng JwtAuthGuard
- [ ] Bảo vệ role bằng RolesGuard nếu cần
- [ ] Viết query Prisma
- [ ] Validate DTO
- [ ] Xử lý exception
- [ ] Viết unit test service
- [ ] Viết e2e test cho API chính
- [ ] Kiểm tra response không lộ dữ liệu nhạy cảm

## 19. Checklist triển khai frontend

- [ ] Tạo route page tương ứng
- [ ] Tạo form/list/detail components
- [ ] Gọi API bằng fetch/axios
- [ ] Xử lý loading state
- [ ] Xử lý empty state
- [ ] Xử lý error state
- [ ] Hiển thị toast thành công/thất bại
- [ ] Kiểm tra điều hướng theo role
- [ ] Test responsive
- [ ] Test với dữ liệu thật từ backend

## 20. Kết luận

Use-case **Quản lý bài làm** là một phần quan trọng trong hệ thống LMS. Tài liệu này mô tả chi tiết từ phạm vi nghiệp vụ, database, API, luồng dữ liệu, sequence, activity flow đến prototype UI và test cases. Khi triển khai, nên bám sát phân quyền và ràng buộc dữ liệu để đảm bảo hệ thống ổn định, dễ mở rộng và dễ bảo trì.
