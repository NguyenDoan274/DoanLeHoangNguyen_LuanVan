# SKILL.md — Use-case: Quản lý khóa học đã đăng ký

## 1. Mục tiêu use-case

Use-case **Quản lý khóa học đã đăng ký** cho phép học viên đăng ký khóa học, xem các khóa học đã tham gia, tiếp tục học và hủy đăng ký khi nghiệp vụ cho phép.

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
| User | Người dùng thông thường/học viên trong hệ thống |
| LMS System | Backend xử lý xác thực, nghiệp vụ và dữ liệu |

Actor chính của use-case này:

```txt
User
```

---

## 3. Phạm vi chức năng

Use-case **Quản lý khóa học đã đăng ký** bao gồm:

```txt
Xem danh sách khóa học đã đăng ký
Đăng ký học khóa học đã published
Kiểm tra trạng thái đã đăng ký
Xem chi tiết enrollment
Tiếp tục học khóa học
Hủy đăng ký nếu khóa học chưa bắt đầu hoặc chính sách cho phép
```

Không bao gồm:

```txt
Tạo khóa học
Tạo bài học
Chấm bài
Duyệt yêu cầu giảng viên
```

Các chức năng không bao gồm sẽ được tách sang use-case khác để báo cáo rõ ràng và dễ triển khai theo module.

---

## 4. Tiền điều kiện và hậu điều kiện

### 4.1. Đăng ký khóa học

| Mục | Nội dung |
|---|---|
| Tiền điều kiện | Actor đã đăng nhập nếu chức năng yêu cầu xác thực; tài khoản phải ở trạng thái `ACTIVE`; dữ liệu liên quan phải tồn tại trong database. |
| Hậu điều kiện | Hệ thống hoàn tất luồng **Đăng ký khóa học**, dữ liệu được cập nhật trong bảng liên quan và frontend hiển thị trạng thái mới. |

### 4.2. Xem khóa học đã đăng ký

| Mục | Nội dung |
|---|---|
| Tiền điều kiện | Actor đã đăng nhập nếu chức năng yêu cầu xác thực; tài khoản phải ở trạng thái `ACTIVE`; dữ liệu liên quan phải tồn tại trong database. |
| Hậu điều kiện | Hệ thống hoàn tất luồng **Xem khóa học đã đăng ký**, dữ liệu được cập nhật trong bảng liên quan và frontend hiển thị trạng thái mới. |

### 4.3. Hủy đăng ký khóa học

| Mục | Nội dung |
|---|---|
| Tiền điều kiện | Actor đã đăng nhập nếu chức năng yêu cầu xác thực; tài khoản phải ở trạng thái `ACTIVE`; dữ liệu liên quan phải tồn tại trong database. |
| Hậu điều kiện | Hệ thống hoàn tất luồng **Hủy đăng ký khóa học**, dữ liệu được cập nhật trong bảng liên quan và frontend hiển thị trạng thái mới. |

---

## 5. Database liên quan

Use-case này chủ yếu sử dụng các bảng: `users`, `courses`, `enrollments`, `course_sections`, `lessons`, `lesson_progress`.

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

### Bảng `course_sections`
```dbml
Table course_sections {
  id uuid [primary key]
  course_id uuid [not null]
  title varchar [not null]
  description text
  order_index integer [not null]
  created_at timestamp
  updated_at timestamp
}
```

Quan hệ chính:
- courses 1 - N course_sections
- course_sections 1 - N lessons

### Bảng `lessons`
```dbml
Table lessons {
  id uuid [primary key]
  section_id uuid [not null]
  title varchar [not null]
  content text
  order_index integer [not null]
  is_preview boolean [default: false]
  mux_upload_id varchar
  mux_asset_id varchar
  mux_playback_id varchar
  mux_status mux_status [default: 'NO_VIDEO']
  duration_sec integer
  created_at timestamp
  updated_at timestamp
}
```

Quan hệ chính:
- course_sections 1 - N lessons
- lessons 1 - N lesson_resources
- lessons 1 - N lesson_progress
- lessons 1 - N quizzes nếu quiz gắn theo bài học

### Bảng `lesson_progress`
```dbml
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
```

Quan hệ chính:
- enrollments 1 - N lesson_progress
- lessons 1 - N lesson_progress

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

- `users`: phục vụ lưu trữ/truy vấn dữ liệu cho use-case **Quản lý khóa học đã đăng ký**.
- `courses`: phục vụ lưu trữ/truy vấn dữ liệu cho use-case **Quản lý khóa học đã đăng ký**.
- `enrollments`: phục vụ lưu trữ/truy vấn dữ liệu cho use-case **Quản lý khóa học đã đăng ký**.
- `course_sections`: phục vụ lưu trữ/truy vấn dữ liệu cho use-case **Quản lý khóa học đã đăng ký**.
- `lessons`: phục vụ lưu trữ/truy vấn dữ liệu cho use-case **Quản lý khóa học đã đăng ký**.
- `lesson_progress`: phục vụ lưu trữ/truy vấn dữ liệu cho use-case **Quản lý khóa học đã đăng ký**.

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
   | EnrollmentsModule / Guards / Services
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
├── enrollments/
│   ├── enrollments.module.ts
│   ├── enrollments.controller.ts
│   ├── enrollments.service.ts
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
| `enrollments.controller.ts` | Nhận request, đọc user từ JWT, gọi service và trả response |
| `enrollments.service.ts` | Xử lý nghiệp vụ chính của use-case **Quản lý khóa học đã đăng ký** |
| `JwtAuthGuard` | Xác thực access token |
| `RolesGuard` | Kiểm tra role `STUDENT`, `INSTRUCTOR`, `ADMIN` |
| `PrismaService` | Thao tác dữ liệu PostgreSQL |
| `DTO` | Validate dữ liệu đầu vào |

---

## 7. API design

### 7.1. Đăng ký học khóa học
```http
POST /courses/:courseId/enroll
Authorization: Bearer access_token
```

Request gợi ý:
```json
{
  "exampleField": "exampleValue",
  "note": "Đăng ký học khóa học"
}
```

Response thành công:
```json
{
  "message": "Đăng ký học khóa học thành công",
  "data": {
    "id": "uuid"
  }
}
```

### 7.2. Lấy danh sách khóa học đã đăng ký
```http
GET /my-courses
Authorization: Bearer access_token
```

Request gợi ý:
```json
// Không bắt buộc body. Có thể dùng query string để search/filter/pagination.
```

Response thành công:
```json
{
  "message": "Lấy danh sách khóa học đã đăng ký thành công",
  "data": {
    "id": "uuid"
  }
}
```

### 7.3. Xem chi tiết lượt đăng ký
```http
GET /enrollments/:id
Authorization: Bearer access_token
```

Request gợi ý:
```json
// Không bắt buộc body. Có thể dùng query string để search/filter/pagination.
```

Response thành công:
```json
{
  "message": "Xem chi tiết lượt đăng ký thành công",
  "data": {
    "id": "uuid"
  }
}
```

### 7.4. Kiểm tra đã đăng ký chưa
```http
GET /courses/:courseId/check-enrollment
Authorization: Bearer access_token
```

Request gợi ý:
```json
// Không bắt buộc body. Có thể dùng query string để search/filter/pagination.
```

Response thành công:
```json
{
  "message": "Kiểm tra đã đăng ký chưa thành công",
  "data": {
    "id": "uuid"
  }
}
```

### 7.5. Hủy đăng ký nếu được phép
```http
PATCH /enrollments/:id/cancel
Authorization: Bearer access_token
```

Request gợi ý:
```json
{
  "exampleField": "exampleValue",
  "note": "Hủy đăng ký nếu được phép"
}
```

Response thành công:
```json
{
  "message": "Hủy đăng ký nếu được phép thành công",
  "data": {
    "id": "uuid"
  }
}
```

---

## 8. Data flow

### 8.1. Data flow — Đăng ký khóa học

```txt
User mở màn hình /my-learning
→ Next.js kiểm tra trạng thái đăng nhập
→ Next.js gửi POST /courses/:courseId/enroll
→ NestJS JwtAuthGuard xác thực access token
→ RolesGuard kiểm tra quyền phù hợp với use-case
→ EnrollmentsController nhận request
→ EnrollmentsService kiểm tra dữ liệu đầu vào
→ Service kiểm tra quan hệ dữ liệu và quyền sở hữu nếu có
→ Service gọi Prisma để thao tác bảng chính: enrollments
→ PostgreSQL trả kết quả
→ Service chuẩn hóa response DTO
→ Controller trả response về frontend
→ Frontend cập nhật UI, hiển thị thông báo và chuyển bước tiếp theo
```

### 8.2. Data flow — Xem khóa học đã đăng ký

```txt
User mở màn hình /my-learning
→ Next.js kiểm tra trạng thái đăng nhập
→ Next.js gửi GET /my-courses
→ NestJS JwtAuthGuard xác thực access token
→ RolesGuard kiểm tra quyền phù hợp với use-case
→ EnrollmentsController nhận request
→ EnrollmentsService kiểm tra dữ liệu đầu vào
→ Service kiểm tra quan hệ dữ liệu và quyền sở hữu nếu có
→ Service gọi Prisma để thao tác bảng chính: enrollments
→ PostgreSQL trả kết quả
→ Service chuẩn hóa response DTO
→ Controller trả response về frontend
→ Frontend cập nhật UI, hiển thị thông báo và chuyển bước tiếp theo
```

### 8.3. Data flow — Hủy đăng ký khóa học

```txt
User mở màn hình /my-learning
→ Next.js kiểm tra trạng thái đăng nhập
→ Next.js gửi GET /enrollments/:id
→ NestJS JwtAuthGuard xác thực access token
→ RolesGuard kiểm tra quyền phù hợp với use-case
→ EnrollmentsController nhận request
→ EnrollmentsService kiểm tra dữ liệu đầu vào
→ Service kiểm tra quan hệ dữ liệu và quyền sở hữu nếu có
→ Service gọi Prisma để thao tác bảng chính: enrollments
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

### 9.1. Sequence — Đăng ký khóa học

```plantuml
@startuml
actor "User" as Actor
participant "Next.js FE" as FE
participant "JwtAuthGuard" as Guard
participant "EnrollmentsController" as Controller
participant "EnrollmentsService" as Service
participant "PrismaService" as Prisma
database "PostgreSQL" as DB

Actor -> FE: Thực hiện thao tác: Đăng ký khóa học
FE -> Guard: POST /courses/:courseId/enroll + JWT
Guard -> Guard: Verify JWT và kiểm tra role

alt Token không hợp lệ hoặc hết hạn
    Guard --> FE: 401 Unauthorized
    FE --> Actor: Yêu cầu đăng nhập lại
else Token hợp lệ
    Guard -> Controller: Cho phép request
    Controller -> Service: Xử lý nghiệp vụ Đăng ký khóa học
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

### 9.2. Sequence — Xem khóa học đã đăng ký

```plantuml
@startuml
actor "User" as Actor
participant "Next.js FE" as FE
participant "JwtAuthGuard" as Guard
participant "EnrollmentsController" as Controller
participant "EnrollmentsService" as Service
participant "PrismaService" as Prisma
database "PostgreSQL" as DB

Actor -> FE: Thực hiện thao tác: Xem khóa học đã đăng ký
FE -> Guard: GET /my-courses + JWT
Guard -> Guard: Verify JWT và kiểm tra role

alt Token không hợp lệ hoặc hết hạn
    Guard --> FE: 401 Unauthorized
    FE --> Actor: Yêu cầu đăng nhập lại
else Token hợp lệ
    Guard -> Controller: Cho phép request
    Controller -> Service: Xử lý nghiệp vụ Xem khóa học đã đăng ký
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

### 9.3. Sequence — Hủy đăng ký khóa học

```plantuml
@startuml
actor "User" as Actor
participant "Next.js FE" as FE
participant "JwtAuthGuard" as Guard
participant "EnrollmentsController" as Controller
participant "EnrollmentsService" as Service
participant "PrismaService" as Prisma
database "PostgreSQL" as DB

Actor -> FE: Thực hiện thao tác: Hủy đăng ký khóa học
FE -> Guard: GET /enrollments/:id + JWT
Guard -> Guard: Verify JWT và kiểm tra role

alt Token không hợp lệ hoặc hết hạn
    Guard --> FE: 401 Unauthorized
    FE --> Actor: Yêu cầu đăng nhập lại
else Token hợp lệ
    Guard -> Controller: Cho phép request
    Controller -> Service: Xử lý nghiệp vụ Hủy đăng ký khóa học
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

### 10.1. Activity flow — Đăng ký khóa học

```txt
Bắt đầu
→ Actor chọn chức năng: Đăng ký khóa học
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

### 10.2. Activity flow — Xem khóa học đã đăng ký

```txt
Bắt đầu
→ Actor chọn chức năng: Xem khóa học đã đăng ký
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

### 10.3. Activity flow — Hủy đăng ký khóa học

```txt
Bắt đầu
→ Actor chọn chức năng: Hủy đăng ký khóa học
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
| `POST /courses/:courseId/enroll` | STUDENT hoặc user đã đăng nhập | Đăng ký học khóa học |
| `GET /my-courses` | STUDENT hoặc user đã đăng nhập | Lấy danh sách khóa học đã đăng ký |
| `GET /enrollments/:id` | STUDENT hoặc user đã đăng nhập | Xem chi tiết lượt đăng ký |
| `GET /courses/:courseId/check-enrollment` | STUDENT hoặc user đã đăng nhập | Kiểm tra đã đăng ký chưa |
| `PATCH /enrollments/:id/cancel` | STUDENT hoặc user đã đăng nhập | Hủy đăng ký nếu được phép |

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

- Xem danh sách khóa học đã đăng ký: kiểm tra dữ liệu bắt buộc, quyền truy cập, trạng thái bản ghi và quan hệ khóa ngoại trước khi xử lý.
- Đăng ký học khóa học đã published: kiểm tra dữ liệu bắt buộc, quyền truy cập, trạng thái bản ghi và quan hệ khóa ngoại trước khi xử lý.
- Kiểm tra trạng thái đã đăng ký: kiểm tra dữ liệu bắt buộc, quyền truy cập, trạng thái bản ghi và quan hệ khóa ngoại trước khi xử lý.
- Xem chi tiết enrollment: kiểm tra dữ liệu bắt buộc, quyền truy cập, trạng thái bản ghi và quan hệ khóa ngoại trước khi xử lý.
- Tiếp tục học khóa học: kiểm tra dữ liệu bắt buộc, quyền truy cập, trạng thái bản ghi và quan hệ khóa ngoại trước khi xử lý.
- Hủy đăng ký nếu khóa học chưa bắt đầu hoặc chính sách cho phép: kiểm tra dữ liệu bắt buộc, quyền truy cập, trạng thái bản ghi và quan hệ khóa ngoại trước khi xử lý.

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

### 15.1. Flow — Đăng ký khóa học

```txt
/my-learning
→ Người dùng chọn chức năng: Đăng ký khóa học
→ Frontend hiển thị form/danh sách tương ứng
→ Người dùng nhập dữ liệu hoặc chọn thao tác
→ Bấm xác nhận
→ Frontend gọi API backend
→ Backend kiểm tra token, role, dữ liệu
→ Backend xử lý nghiệp vụ
→ Frontend nhận response
→ UI cập nhật dữ liệu mới và hiển thị toast thông báo
```

### 15.2. Flow — Xem khóa học đã đăng ký

```txt
/my-learning
→ Người dùng chọn chức năng: Xem khóa học đã đăng ký
→ Frontend hiển thị form/danh sách tương ứng
→ Người dùng nhập dữ liệu hoặc chọn thao tác
→ Bấm xác nhận
→ Frontend gọi API backend
→ Backend kiểm tra token, role, dữ liệu
→ Backend xử lý nghiệp vụ
→ Frontend nhận response
→ UI cập nhật dữ liệu mới và hiển thị toast thông báo
```

### 15.3. Flow — Hủy đăng ký khóa học

```txt
/my-learning
→ Người dùng chọn chức năng: Hủy đăng ký khóa học
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
| Use-case: Quản lý khóa học đã đăng ký                   |
| Route: /my-learning                                       |
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
| TC06 | Kiểm tra chức năng: Xem danh sách khóa học đã đăng ký | Hệ thống xử lý đúng nghiệp vụ và cập nhật dữ liệu chính xác |
| TC07 | Kiểm tra chức năng: Đăng ký học khóa học đã published | Hệ thống xử lý đúng nghiệp vụ và cập nhật dữ liệu chính xác |
| TC08 | Kiểm tra chức năng: Kiểm tra trạng thái đã đăng ký | Hệ thống xử lý đúng nghiệp vụ và cập nhật dữ liệu chính xác |
| TC09 | Kiểm tra chức năng: Xem chi tiết enrollment | Hệ thống xử lý đúng nghiệp vụ và cập nhật dữ liệu chính xác |
| TC10 | Kiểm tra chức năng: Tiếp tục học khóa học | Hệ thống xử lý đúng nghiệp vụ và cập nhật dữ liệu chính xác |
| TC11 | Kiểm tra chức năng: Hủy đăng ký nếu khóa học chưa bắt đầu hoặc chính sách cho phép | Hệ thống xử lý đúng nghiệp vụ và cập nhật dữ liệu chính xác |
| TC12 | Kiểm tra edge case 1 của use-case | Không phát sinh lỗi ngoài dự kiến, message rõ ràng |
| TC13 | Kiểm tra edge case 1 của use-case | Không phát sinh lỗi ngoài dự kiến, message rõ ràng |
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

Use-case **Quản lý khóa học đã đăng ký** là một phần quan trọng trong hệ thống LMS. Tài liệu này mô tả chi tiết từ phạm vi nghiệp vụ, database, API, luồng dữ liệu, sequence, activity flow đến prototype UI và test cases. Khi triển khai, nên bám sát phân quyền và ràng buộc dữ liệu để đảm bảo hệ thống ổn định, dễ mở rộng và dễ bảo trì.
