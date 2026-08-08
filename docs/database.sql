--
-- PostgreSQL database dump
--

\restrict Pab8QzTzrmU430bx1Gcw0rlKXWWcgUwCespe6Tibjj6H9zV1ThJapCYEeBuqxOy

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.9

-- Started on 2026-08-08 23:35:29

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 37 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS public;


--
-- TOC entry 3921 (class 0 OID 0)
-- Dependencies: 37
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- TOC entry 1155 (class 1247 OID 17479)
-- Name: coupon_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.coupon_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'EXPIRED'
);


--
-- TOC entry 1158 (class 1247 OID 17486)
-- Name: course_level; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.course_level AS ENUM (
    'BEGINNER',
    'INTERMEDIATE',
    'ADVANCED'
);


--
-- TOC entry 1161 (class 1247 OID 17494)
-- Name: course_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.course_status AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'HIDDEN'
);


--
-- TOC entry 1164 (class 1247 OID 17502)
-- Name: enrollment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enrollment_status AS ENUM (
    'ACTIVE',
    'CANCELLED'
);


--
-- TOC entry 1167 (class 1247 OID 17508)
-- Name: mux_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.mux_status AS ENUM (
    'NO_VIDEO',
    'PROCESSING',
    'READY',
    'ERRORED'
);


--
-- TOC entry 1170 (class 1247 OID 17518)
-- Name: order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.order_status AS ENUM (
    'PENDING',
    'COMPLETED',
    'FAILED',
    'CANCELLED'
);


--
-- TOC entry 1173 (class 1247 OID 17528)
-- Name: payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_status AS ENUM (
    'PENDING',
    'SUCCESS',
    'FAILED'
);


--
-- TOC entry 1176 (class 1247 OID 17536)
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'STUDENT',
    'INSTRUCTOR',
    'ADMIN'
);


--
-- TOC entry 1179 (class 1247 OID 17544)
-- Name: user_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'BANNED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 306 (class 1259 OID 17551)
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- TOC entry 307 (class 1259 OID 17558)
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid NOT NULL,
    name character varying NOT NULL,
    description text,
    created_at timestamp(6) without time zone,
    updated_at timestamp(6) without time zone,
    parent_id uuid
);


--
-- TOC entry 308 (class 1259 OID 17563)
-- Name: coupons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.coupons (
    id uuid NOT NULL,
    code character varying NOT NULL,
    discount_percentage numeric(5,2) NOT NULL,
    start_date timestamp(6) without time zone,
    end_date timestamp(6) without time zone,
    usage_limit integer,
    used_count integer DEFAULT 0,
    status public.coupon_status DEFAULT 'ACTIVE'::public.coupon_status NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp(6) without time zone,
    updated_at timestamp(6) without time zone
);


--
-- TOC entry 309 (class 1259 OID 17570)
-- Name: course_group_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_group_items (
    course_group_id uuid NOT NULL,
    course_id uuid NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    is_required boolean DEFAULT true NOT NULL
);


--
-- TOC entry 310 (class 1259 OID 17575)
-- Name: course_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_groups (
    id uuid NOT NULL,
    owner_id uuid NOT NULL,
    category_id uuid NOT NULL,
    title character varying NOT NULL,
    description text,
    order_index integer DEFAULT 0 NOT NULL,
    created_at timestamp(6) without time zone,
    updated_at timestamp(6) without time zone
);


--
-- TOC entry 311 (class 1259 OID 17581)
-- Name: course_sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_sections (
    id uuid NOT NULL,
    course_id uuid NOT NULL,
    title character varying NOT NULL,
    description text,
    order_index integer NOT NULL,
    created_at timestamp(6) without time zone,
    updated_at timestamp(6) without time zone
);


--
-- TOC entry 312 (class 1259 OID 17586)
-- Name: courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courses (
    id uuid NOT NULL,
    instructor_id uuid NOT NULL,
    category_id uuid NOT NULL,
    title character varying NOT NULL,
    short_description text,
    description text,
    thumbnail_url text,
    level public.course_level DEFAULT 'BEGINNER'::public.course_level NOT NULL,
    status public.course_status DEFAULT 'DRAFT'::public.course_status NOT NULL,
    price numeric(10,2) DEFAULT 0 NOT NULL,
    is_recommend boolean DEFAULT false NOT NULL,
    created_at timestamp(6) without time zone,
    updated_at timestamp(6) without time zone
);


--
-- TOC entry 313 (class 1259 OID 17595)
-- Name: enrollments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enrollments (
    id uuid NOT NULL,
    student_id uuid NOT NULL,
    course_id uuid NOT NULL,
    order_item_id uuid,
    status public.enrollment_status DEFAULT 'ACTIVE'::public.enrollment_status NOT NULL,
    enrolled_at timestamp(6) without time zone,
    completed_at timestamp(6) without time zone
);


--
-- TOC entry 314 (class 1259 OID 17599)
-- Name: lessons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lessons (
    id uuid NOT NULL,
    section_id uuid NOT NULL,
    title character varying NOT NULL,
    content text,
    order_index integer NOT NULL,
    is_preview boolean DEFAULT false,
    mux_upload_id character varying,
    mux_asset_id character varying,
    mux_playback_id character varying,
    mux_status public.mux_status DEFAULT 'NO_VIDEO'::public.mux_status,
    duration_sec integer,
    created_at timestamp(6) without time zone,
    updated_at timestamp(6) without time zone
);


--
-- TOC entry 315 (class 1259 OID 17606)
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id uuid NOT NULL,
    order_id uuid NOT NULL,
    course_id uuid NOT NULL,
    base_price numeric(10,2) NOT NULL,
    promotion_id uuid,
    promotion_discount numeric(10,2) DEFAULT 0,
    final_price numeric(10,2) NOT NULL
);


--
-- TOC entry 316 (class 1259 OID 17610)
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid NOT NULL,
    student_id uuid NOT NULL,
    coupon_id uuid,
    base_price numeric(10,2) NOT NULL,
    promotion_discount numeric(10,2) DEFAULT 0,
    coupon_discount numeric(10,2) DEFAULT 0,
    final_price numeric(10,2) NOT NULL,
    status public.order_status DEFAULT 'PENDING'::public.order_status NOT NULL,
    created_at timestamp(6) without time zone,
    updated_at timestamp(6) without time zone
);


--
-- TOC entry 317 (class 1259 OID 17616)
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id uuid NOT NULL,
    order_id uuid NOT NULL,
    payment_method character varying NOT NULL,
    transaction_reference character varying,
    amount numeric(10,2) NOT NULL,
    status public.payment_status DEFAULT 'PENDING'::public.payment_status NOT NULL,
    paid_at timestamp(6) without time zone,
    created_at timestamp(6) without time zone
);


--
-- TOC entry 318 (class 1259 OID 17622)
-- Name: promotion_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promotion_categories (
    promotion_id uuid NOT NULL,
    category_id uuid NOT NULL
);


--
-- TOC entry 319 (class 1259 OID 17625)
-- Name: promotion_courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promotion_courses (
    promotion_id uuid NOT NULL,
    course_id uuid NOT NULL
);


--
-- TOC entry 320 (class 1259 OID 17628)
-- Name: promotions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promotions (
    id uuid NOT NULL,
    name character varying NOT NULL,
    discount_percentage numeric(5,2) NOT NULL,
    start_date timestamp(6) without time zone NOT NULL,
    end_date timestamp(6) without time zone NOT NULL,
    is_active boolean DEFAULT true,
    created_by uuid NOT NULL,
    created_at timestamp(6) without time zone,
    updated_at timestamp(6) without time zone
);


--
-- TOC entry 321 (class 1259 OID 17634)
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    full_name character varying NOT NULL,
    email character varying NOT NULL,
    password_hash text NOT NULL,
    avatar_url text,
    role public.user_role DEFAULT 'STUDENT'::public.user_role NOT NULL,
    status public.user_status DEFAULT 'ACTIVE'::public.user_status NOT NULL,
    created_at timestamp(6) without time zone,
    updated_at timestamp(6) without time zone
);


--
-- TOC entry 3900 (class 0 OID 17551)
-- Dependencies: 306
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public._prisma_migrations VALUES ('5a5d3ecb-866f-4789-a86b-3cbb4b1f6864', '260169cfc546cbbd8c66ffe387c315ec535d2e46e4086a501981568904ce6140', '2026-07-10 09:20:07.782277+00', '20260710092006_clean_lessons_and_enrollment', NULL, NULL, '2026-07-10 09:20:07.07643+00', 1);


--
-- TOC entry 3901 (class 0 OID 17558)
-- Dependencies: 307
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.categories VALUES ('48fd0e01-cf10-4e89-8700-2378287b9486', 'Toán', 'Toán học', '2026-07-10 09:33:01.694', '2026-07-10 09:33:01.694', NULL);
INSERT INTO public.categories VALUES ('0869495b-075e-426c-b0a6-7662f4327922', 'Tiếng Anh', 'Anh văn
', '2026-07-10 09:33:11.396', '2026-07-10 09:33:11.396', NULL);
INSERT INTO public.categories VALUES ('883e2521-7b5c-4736-bbfa-84a1373c2768', 'Lịch sử', 'lịch sử
', '2026-07-10 09:33:30.041', '2026-07-10 09:33:30.041', NULL);
INSERT INTO public.categories VALUES ('9c512add-03e5-4915-ab82-9b4e856211c8', 'CNTT', 'Công nghệ thông tin
', '2026-07-10 09:33:20.252', '2026-08-07 04:57:31.019', NULL);
INSERT INTO public.categories VALUES ('120d0d97-10ac-40b6-89b0-49ebf8974664', 'Lịch sử Việt Nam', 'Lịch sử Việt Nam', '2026-08-07 04:48:18.036', '2026-08-07 05:43:31.616', '883e2521-7b5c-4736-bbfa-84a1373c2768');


--
-- TOC entry 3902 (class 0 OID 17563)
-- Dependencies: 308
-- Data for Name: coupons; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.coupons VALUES ('3d48cbf0-d835-487e-af9b-a3483104eb7b', 'HEHE', 25.00, '2026-07-10 00:00:00', '2026-09-19 00:00:00', NULL, 7, 'ACTIVE', '904c2dbb-e97d-4f27-ab85-54b621635eca', '2026-07-10 10:06:36.988', '2026-07-24 11:17:15.572');


--
-- TOC entry 3903 (class 0 OID 17570)
-- Dependencies: 309
-- Data for Name: course_group_items; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.course_group_items VALUES ('586a9ff4-283d-4987-8d74-e7e64bc6b671', 'aee3fe53-e209-4ca6-a6c1-1aaf264ecec2', 0, false);
INSERT INTO public.course_group_items VALUES ('586a9ff4-283d-4987-8d74-e7e64bc6b671', '6b1686b8-f8af-4f62-a3f9-887e3c533036', 1, false);
INSERT INTO public.course_group_items VALUES ('6be00ddd-cb00-47b8-9c36-e8d9c63c77ba', 'a5bab279-9fec-472d-bcd7-6c93e0942a02', 0, false);
INSERT INTO public.course_group_items VALUES ('d01f683a-09b7-401a-b122-4559223157bd', '1e472d90-b5b4-4a24-88ab-4210b99914e1', 0, false);
INSERT INTO public.course_group_items VALUES ('8f958d1d-f4f9-44fc-80ff-d795499a0a4d', '981a2788-ea1a-41b8-8ec3-dc77b525c38f', 0, false);
INSERT INTO public.course_group_items VALUES ('54c5a7f9-2f55-4b46-b0e7-2d69b0e7249a', 'f8fff5ea-4441-4b5b-9ac5-e7105501701a', 0, false);
INSERT INTO public.course_group_items VALUES ('54c5a7f9-2f55-4b46-b0e7-2d69b0e7249a', '506763ac-c809-442d-9073-c07979bfda33', 1, false);
INSERT INTO public.course_group_items VALUES ('54c5a7f9-2f55-4b46-b0e7-2d69b0e7249a', 'c35d5069-d169-4448-8372-03dfcc35a137', 2, false);
INSERT INTO public.course_group_items VALUES ('9d59bced-94fa-4e26-a141-f5c3d1e1e5bf', 'a9b6a042-00eb-4175-8a5d-44e65a98f727', 0, false);
INSERT INTO public.course_group_items VALUES ('9d59bced-94fa-4e26-a141-f5c3d1e1e5bf', 'e2e2b733-4bc4-47f4-ba55-e0f77992d3c8', 1, false);
INSERT INTO public.course_group_items VALUES ('d3a17d3b-309d-4e2a-b22e-998e7b32efcc', 'a8ec8846-a349-4598-86f8-5aa466708183', 0, false);
INSERT INTO public.course_group_items VALUES ('d3a17d3b-309d-4e2a-b22e-998e7b32efcc', 'fafed130-10a6-4315-b006-3ce862dfd27f', 1, false);


--
-- TOC entry 3904 (class 0 OID 17575)
-- Dependencies: 310
-- Data for Name: course_groups; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.course_groups VALUES ('586a9ff4-283d-4987-8d74-e7e64bc6b671', '6f729c9b-de6d-480d-add0-3737ea211bb7', '9c512add-03e5-4915-ab82-9b4e856211c8', 'IT', 'đây là các môn chuyên ngành CNTT
', 0, '2026-07-18 15:14:56.048', '2026-07-18 15:14:56.048');
INSERT INTO public.course_groups VALUES ('54c5a7f9-2f55-4b46-b0e7-2d69b0e7249a', '6f729c9b-de6d-480d-add0-3737ea211bb7', '0869495b-075e-426c-b0a6-7662f4327922', 'Toeic', 'Lấy gốc Toeic', 0, '2026-07-23 03:20:29.178', '2026-07-23 03:20:29.178');
INSERT INTO public.course_groups VALUES ('9d59bced-94fa-4e26-a141-f5c3d1e1e5bf', '6f729c9b-de6d-480d-add0-3737ea211bb7', '48fd0e01-cf10-4e89-8700-2378287b9486', 'Toán cao cấp', 'Toán cao cấp', 0, '2026-07-23 03:21:52.857', '2026-07-24 10:42:07.888');
INSERT INTO public.course_groups VALUES ('75299fa8-5f1f-468b-8a8f-62d66ae0fc45', '6f729c9b-de6d-480d-add0-3737ea211bb7', '48fd0e01-cf10-4e89-8700-2378287b9486', 'Lấy gốc toán', 'Lấy lại gốc môn toán', 0, '2026-07-23 03:21:07.871', '2026-07-24 10:45:57.091');
INSERT INTO public.course_groups VALUES ('8f958d1d-f4f9-44fc-80ff-d795499a0a4d', '6f729c9b-de6d-480d-add0-3737ea211bb7', '883e2521-7b5c-4736-bbfa-84a1373c2768', 'Lịch sử chính trị', 'Nâng cao lòng yêu nước', 0, '2026-07-23 03:18:53.51', '2026-07-24 10:46:36.856');
INSERT INTO public.course_groups VALUES ('d01f683a-09b7-401a-b122-4559223157bd', '6f729c9b-de6d-480d-add0-3737ea211bb7', '883e2521-7b5c-4736-bbfa-84a1373c2768', 'Lịch sử ', 'Hiểu hơn về quá khứ', 0, '2026-07-23 03:18:32.64', '2026-07-24 10:46:58.048');
INSERT INTO public.course_groups VALUES ('d3a17d3b-309d-4e2a-b22e-998e7b32efcc', '6f729c9b-de6d-480d-add0-3737ea211bb7', '0869495b-075e-426c-b0a6-7662f4327922', 'Nhập môn tiếng anh', 'Lấy lại gốc tiếng anh', 0, '2026-07-18 15:30:33.353', '2026-07-24 10:50:46.405');
INSERT INTO public.course_groups VALUES ('6be00ddd-cb00-47b8-9c36-e8d9c63c77ba', '6f729c9b-de6d-480d-add0-3737ea211bb7', '48fd0e01-cf10-4e89-8700-2378287b9486', 'Toán vỡ lòng', 'Ôn lại kiến thức toán lớp 8', 0, '2026-07-20 12:02:57.009', '2026-07-24 10:51:15.988');


--
-- TOC entry 3905 (class 0 OID 17581)
-- Dependencies: 311
-- Data for Name: course_sections; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.course_sections VALUES ('61c5940f-47a5-40c9-a319-03ecc36b225d', 'a5bab279-9fec-472d-bcd7-6c93e0942a02', 'Đại số', 'Đơn thức, đa thức', 0, '2026-07-10 09:35:56.944', '2026-07-10 09:36:19.141');
INSERT INTO public.course_sections VALUES ('69f4e969-78af-4451-a90c-f9093b7dcc2a', 'a5bab279-9fec-472d-bcd7-6c93e0942a02', 'Hình học', 'Các loại góc, đường và hình', 1, '2026-07-10 09:36:42.643', '2026-07-10 09:36:42.643');
INSERT INTO public.course_sections VALUES ('a2027eb3-b954-4b07-8888-2a5bab351c66', '6b1686b8-f8af-4f62-a3f9-887e3c533036', 'CRUD danh mục', 'Thêm, sửa, xóa danh mục', 0, '2026-07-10 10:11:29.52', '2026-07-10 10:11:29.52');
INSERT INTO public.course_sections VALUES ('86635dcc-72c7-4455-8a2c-05a620c036bf', 'aee3fe53-e209-4ca6-a6c1-1aaf264ecec2', 'new', 'new 1', 0, '2026-07-10 11:46:16.906', '2026-07-10 11:46:16.906');
INSERT INTO public.course_sections VALUES ('17604833-de29-4303-a9cd-1efff4f43ea2', 'e2e2b733-4bc4-47f4-ba55-e0f77992d3c8', '123', 'ádá', 0, '2026-07-23 16:48:21.169', '2026-07-23 16:50:39.382');
INSERT INTO public.course_sections VALUES ('fb07fcd7-3c44-41e2-9fc9-1fc9f928bfb8', '89fab445-349e-428a-87e7-e821052bbbdb', 'Cấu Trúc Dữ Liệu', 'các kiểu cấu trúc dữ liệu', 0, '2026-07-23 16:44:05.011', '2026-07-26 19:37:31.399');
INSERT INTO public.course_sections VALUES ('90f8bdc6-dd9a-4463-ae64-2f0bf6cfab39', '89fab445-349e-428a-87e7-e821052bbbdb', 'Cơ sở dữ liệu', 'Database', 1, '2026-07-23 16:43:50.198', '2026-07-26 19:37:31.783');
INSERT INTO public.course_sections VALUES ('b2b49fc6-7c2e-41d9-b2ef-db94f57e4fe8', 'c5b988d8-4cf1-4766-92b8-5ec12c89db90', '1', '1', 0, '2026-08-08 15:53:49.437', '2026-08-08 15:53:49.437');


--
-- TOC entry 3906 (class 0 OID 17586)
-- Dependencies: 312
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.courses VALUES ('c35d5069-d169-4448-8372-03dfcc35a137', '6f729c9b-de6d-480d-add0-3737ea211bb7', '0869495b-075e-426c-b0a6-7662f4327922', 'Toeic 700+', 'từ 1 giảng viên vừa được 795 điểm', 'từ 1 giảng viên vừa được 795 điểm', '/uploads/thumbnails/toeic_700+_da3f92f2-b996-4474-8bbe-8f0cb67e7651.jpg', 'INTERMEDIATE', 'PUBLISHED', 55000.00, false, '2026-07-23 03:00:53.624', '2026-07-24 10:06:33.346');
INSERT INTO public.courses VALUES ('f8fff5ea-4441-4b5b-9ac5-e7105501701a', '6f729c9b-de6d-480d-add0-3737ea211bb7', '0869495b-075e-426c-b0a6-7662f4327922', 'Lấy gốc Toeic', 'Toeic không khó như bạn nghĩ', 'Toeic không khó như bạn nghĩ', '/uploads/thumbnails/lấy_gốc_toeic_6c1c0a51-40c3-4e32-9fec-4a2f6105ef4e.webp', 'BEGINNER', 'PUBLISHED', 14000.00, false, '2026-07-23 03:01:32.077', '2026-07-24 10:07:24.496');
INSERT INTO public.courses VALUES ('506763ac-c809-442d-9073-c07979bfda33', '6f729c9b-de6d-480d-add0-3737ea211bb7', '0869495b-075e-426c-b0a6-7662f4327922', 'Toeic 450+', 'toeic', 'toeic
', '/uploads/thumbnails/toeic_450+_be1939b5-a93b-4318-bfd5-9e3668aefd3a.jpg', 'BEGINNER', 'PUBLISHED', 55000.00, false, '2026-07-23 02:58:45.929', '2026-07-24 10:09:00.854');
INSERT INTO public.courses VALUES ('981a2788-ea1a-41b8-8ec3-dc77b525c38f', '6f729c9b-de6d-480d-add0-3737ea211bb7', '883e2521-7b5c-4736-bbfa-84a1373c2768', 'Lịch sử Đảng', 'lịch sủ', 'lịch sử', '/uploads/thumbnails/lịch_sử_đảng_a7d920a3-6305-4d13-9cd4-9073102884f1.jpg', 'BEGINNER', 'PUBLISHED', 55000.00, false, '2026-07-23 02:59:37.12', '2026-07-24 10:09:44.25');
INSERT INTO public.courses VALUES ('a5bab279-9fec-472d-bcd7-6c93e0942a02', '6f729c9b-de6d-480d-add0-3737ea211bb7', '48fd0e01-cf10-4e89-8700-2378287b9486', 'Lấy gốc toán', 'Ông giáo math là kênh kiến thức về TOÁN TH & THCS', 'Các bài giảng của thầy đều hoàn toàn miễn phí.
Với mỗi bài thầy đều chia làm 2 phần:
Phần 1 Video LÝ THUYẾT
Phần 2 Video BÀI TẬP
Nếu có bất kỳ câu hỏi nào về bài giảng, bài tập các em hãy comment để thầy cùng giải đáp với các em nhé!!!
CHÚC CÁC EM NGÀY CÀNG TIẾN BỘ. ', '/uploads/thumbnails/lấy_gốc_toán_94374ed9-977d-49bd-ae8e-03d052d360c5.png', 'BEGINNER', 'PUBLISHED', 250000.00, true, '2026-07-10 09:35:11.246', '2026-07-10 09:47:36.505');
INSERT INTO public.courses VALUES ('6b1686b8-f8af-4f62-a3f9-887e3c533036', '6f729c9b-de6d-480d-add0-3737ea211bb7', '9c512add-03e5-4915-ab82-9b4e856211c8', 'expressJS', 'nhập môn express', 'Ở đay bạn sẽ hiểu được các cấu trúc và câu lệnh cơ bản của nodejs với framework ExpressJS', '/uploads/thumbnails/expressjs_4aaf733d-d68a-43f6-adf2-18bda343f107.png', 'BEGINNER', 'PUBLISHED', 150000.00, true, '2026-07-10 10:10:52.702', '2026-07-24 10:12:11.185');
INSERT INTO public.courses VALUES ('89fab445-349e-428a-87e7-e821052bbbdb', '6f729c9b-de6d-480d-add0-3737ea211bb7', '9c512add-03e5-4915-ab82-9b4e856211c8', 'Nhập môn công nghệ thông tin', 'Tìm hiểu về CNTT', '1 số kiến thức cần biết về CNTT', '/uploads/thumbnails/nhập_môn_công_nghệ_thông_tin_fa6c67b7-ff43-4665-8b64-9d44d010a418.jpg', 'BEGINNER', 'PUBLISHED', 123000.00, false, '2026-07-23 03:02:32.948', '2026-07-24 10:29:50.157');
INSERT INTO public.courses VALUES ('aee3fe53-e209-4ca6-a6c1-1aaf264ecec2', '6f729c9b-de6d-480d-add0-3737ea211bb7', '9c512add-03e5-4915-ab82-9b4e856211c8', 'NodeJS', 'Tìm hiểu về NodeJS', 'Hiểu hơn về 1 trong những meta runtime hiện đại hiện nay là NodeJS', '/uploads/thumbnails/nodejs_778ac38c-366c-4f7d-89f8-0e9f5502943f.jpeg', 'INTERMEDIATE', 'PUBLISHED', 150000.00, true, '2026-07-10 11:45:51.275', '2026-07-24 10:37:50.716');
INSERT INTO public.courses VALUES ('a9b6a042-00eb-4175-8a5d-44e65a98f727', '6f729c9b-de6d-480d-add0-3737ea211bb7', '48fd0e01-cf10-4e89-8700-2378287b9486', 'Toán cao cấp 1', 'Toán cao cấp', 'Đại số tuyến tính', '/uploads/thumbnails/toán_cao_cấp_1_f7c2337c-31f8-4e62-83c7-8f149d320b63.png', 'INTERMEDIATE', 'PUBLISHED', 0.00, true, '2026-07-19 18:24:19.57', '2026-07-24 10:43:56.209');
INSERT INTO public.courses VALUES ('e2e2b733-4bc4-47f4-ba55-e0f77992d3c8', '6f729c9b-de6d-480d-add0-3737ea211bb7', '48fd0e01-cf10-4e89-8700-2378287b9486', 'Toán cao cấp 2', 'Toán cao cấp 2', 'Giải tích', '/uploads/thumbnails/toán_cao_cấp_2_de8b52d0-3b92-4874-b5db-1fb59b60e666.jpg', 'INTERMEDIATE', 'PUBLISHED', 12000.00, false, '2026-07-23 03:02:19.16', '2026-07-24 10:44:36.959');
INSERT INTO public.courses VALUES ('a8ec8846-a349-4598-86f8-5aa466708183', '6f729c9b-de6d-480d-add0-3737ea211bb7', '48fd0e01-cf10-4e89-8700-2378287b9486', 'Tiếng anh cho người mất gốc', 'tiếng anh vỡ lòng', 'Lấy lại gốc tiếng anh', '/uploads/thumbnails/tiếng_anh_cho_người_mất_gốc_484bf7b6-f0f2-4724-9b1c-938c5a732d56.png', 'BEGINNER', 'PUBLISHED', 123000.00, true, '2026-07-18 15:28:21.208', '2026-07-24 10:49:01.357');
INSERT INTO public.courses VALUES ('fafed130-10a6-4315-b006-3ce862dfd27f', '6f729c9b-de6d-480d-add0-3737ea211bb7', '0869495b-075e-426c-b0a6-7662f4327922', 'Tiếng anh cho người mới bắt đầu', 'tiếng anh cho người mới bắt đầu', 'tiếng anh cho người mới bắt đầu sau khi đã lấy lại gốc', '/uploads/thumbnails/tiếng_anh_cho_người_mới_bắt_đầu_983a99b6-992c-456a-803c-6b4bebfa768e.jpg', 'BEGINNER', 'PUBLISHED', 500000.00, true, '2026-07-18 15:30:21.464', '2026-07-24 10:50:12.117');
INSERT INTO public.courses VALUES ('1e472d90-b5b4-4a24-88ab-4210b99914e1', '6f729c9b-de6d-480d-add0-3737ea211bb7', '120d0d97-10ac-40b6-89b0-49ebf8974664', 'Lịch sử việt nam', 'lịch sử việt nam', 'lịch sử việt nam', '/uploads/thumbnails/lịch_sử_việt_nam_6318ee35-885b-4b32-b8d0-2091e0a600cf.jpg', 'BEGINNER', 'PUBLISHED', 25000.00, false, '2026-07-23 03:00:09.193', '2026-08-07 04:48:40.062');
INSERT INTO public.courses VALUES ('728458ba-9d85-4294-b8dc-2eb9360ae9ec', '186daffa-eb1b-46ce-9b95-7d59a5e758c1', '9c512add-03e5-4915-ab82-9b4e856211c8', 'Tin học đại cương', 'Nhập môn word,excel,...', 'ở khóa học này bạn sẻ thành thạo hơn các cách sử dụng word, excel,...', '/uploads/thumbnails/tin_học_đại_cương_35910df8-0aab-4eb3-a666-6a573fae1fbc.jpg', 'BEGINNER', 'PUBLISHED', 55000.00, false, '2026-08-08 11:33:24.774', '2026-08-08 11:33:37.523');
INSERT INTO public.courses VALUES ('c5b988d8-4cf1-4766-92b8-5ec12c89db90', '6f729c9b-de6d-480d-add0-3737ea211bb7', '120d0d97-10ac-40b6-89b0-49ebf8974664', 'test', 'trêst', 'tesdt', NULL, 'BEGINNER', 'PUBLISHED', 0.00, false, '2026-08-08 15:53:42', '2026-08-08 15:53:42');


--
-- TOC entry 3907 (class 0 OID 17595)
-- Dependencies: 313
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.enrollments VALUES ('b11ae6ee-fb88-44b0-a170-c7a05c7d1244', '7d084b5b-4fa7-458b-9ebb-ab08f785de31', 'a5bab279-9fec-472d-bcd7-6c93e0942a02', '5f76da86-89f9-4670-8a35-43d6583748ab', 'ACTIVE', '2026-07-10 10:07:27.823', NULL);
INSERT INTO public.enrollments VALUES ('10d4c082-9170-47b8-b2e7-4aa5979ce04f', '42001a2c-a4a2-4e6d-90ff-5fe06b87eafb', 'a5bab279-9fec-472d-bcd7-6c93e0942a02', '02ebce9b-5bb8-4ee1-be94-1f35282d51d3', 'ACTIVE', '2026-07-18 15:14:07.143', NULL);
INSERT INTO public.enrollments VALUES ('51dc944f-e5c5-4c98-910d-083cef7ebb02', '42001a2c-a4a2-4e6d-90ff-5fe06b87eafb', 'aee3fe53-e209-4ca6-a6c1-1aaf264ecec2', '435a2fa5-1aa3-4616-b920-1a444bbd1556', 'ACTIVE', '2026-07-18 15:18:22.133', NULL);
INSERT INTO public.enrollments VALUES ('1cc1cdbd-2a42-44bd-8129-7d61d3be3090', '42001a2c-a4a2-4e6d-90ff-5fe06b87eafb', '6b1686b8-f8af-4f62-a3f9-887e3c533036', 'e881007e-6edc-4777-a1c3-9020413a55a0', 'ACTIVE', '2026-07-18 15:19:48.769', NULL);
INSERT INTO public.enrollments VALUES ('c0842228-5d1f-48ec-bc2a-380faa48ebd9', '42001a2c-a4a2-4e6d-90ff-5fe06b87eafb', 'a8ec8846-a349-4598-86f8-5aa466708183', '014ada87-bacd-4e21-85d9-2771de269e90', 'ACTIVE', '2026-07-18 15:37:11.519', NULL);
INSERT INTO public.enrollments VALUES ('71dcaf64-ff3c-431b-80fc-7af591c8704b', '42001a2c-a4a2-4e6d-90ff-5fe06b87eafb', 'fafed130-10a6-4315-b006-3ce862dfd27f', '72a00dd6-a18d-4cdb-b8e6-98cfa25678cb', 'ACTIVE', '2026-07-18 15:37:11.996', NULL);
INSERT INTO public.enrollments VALUES ('81d4d422-8ec9-469f-a0c9-db3630fe6f83', '7d084b5b-4fa7-458b-9ebb-ab08f785de31', 'a9b6a042-00eb-4175-8a5d-44e65a98f727', NULL, 'ACTIVE', '2026-07-19 18:24:41.564', NULL);
INSERT INTO public.enrollments VALUES ('f892ea8b-74ae-452d-95f3-84eb9d2412fa', '42001a2c-a4a2-4e6d-90ff-5fe06b87eafb', '89fab445-349e-428a-87e7-e821052bbbdb', 'd1a4969f-190b-4857-85b1-e17edae5afc7', 'ACTIVE', '2026-07-23 13:55:16.322', NULL);
INSERT INTO public.enrollments VALUES ('2a34fc88-c83d-4f1f-ae20-4bb7c7b1599f', '42001a2c-a4a2-4e6d-90ff-5fe06b87eafb', 'f8fff5ea-4441-4b5b-9ac5-e7105501701a', '38025e94-6a19-49a7-ac1d-93b76a2b4379', 'ACTIVE', '2026-07-23 15:44:02.18', NULL);
INSERT INTO public.enrollments VALUES ('efbfe8a8-7363-437f-832f-36d8fbdcfa76', '42001a2c-a4a2-4e6d-90ff-5fe06b87eafb', '506763ac-c809-442d-9073-c07979bfda33', '8249a243-734f-4719-ba16-8ec98013fa8f', 'ACTIVE', '2026-07-23 15:44:02.465', NULL);
INSERT INTO public.enrollments VALUES ('0e8a3ab3-47cc-463a-ad95-de0ada79580f', '42001a2c-a4a2-4e6d-90ff-5fe06b87eafb', 'c35d5069-d169-4448-8372-03dfcc35a137', '64687434-85e8-4472-b652-33aa0879d1f6', 'ACTIVE', '2026-07-23 15:44:02.608', NULL);
INSERT INTO public.enrollments VALUES ('060d6237-06cb-434b-be1c-bd85f7d1af6a', '42001a2c-a4a2-4e6d-90ff-5fe06b87eafb', 'e2e2b733-4bc4-47f4-ba55-e0f77992d3c8', 'c518ada0-97e6-47ac-9c05-a10a42371c3a', 'ACTIVE', '2026-07-23 19:38:41.113', NULL);
INSERT INTO public.enrollments VALUES ('a7ee55a3-6e98-4d99-b9a7-7dbaff016584', '7d084b5b-4fa7-458b-9ebb-ab08f785de31', '89fab445-349e-428a-87e7-e821052bbbdb', '2f75420d-f6ea-46b2-bf3b-bb1530d27159', 'ACTIVE', '2026-07-24 11:24:31.034', NULL);
INSERT INTO public.enrollments VALUES ('2cd5bc1a-aada-4214-8ae0-fb01f13dcb5f', '7d084b5b-4fa7-458b-9ebb-ab08f785de31', '6b1686b8-f8af-4f62-a3f9-887e3c533036', 'cb4ffe86-d3c3-486c-a52c-455378454671', 'ACTIVE', '2026-08-06 16:48:00.684', NULL);
INSERT INTO public.enrollments VALUES ('ac90f00f-eeff-44ac-9b4d-e4eb554a2d08', '7d084b5b-4fa7-458b-9ebb-ab08f785de31', 'e2e2b733-4bc4-47f4-ba55-e0f77992d3c8', '40ea6694-9b23-47f7-b9ec-a35e7df8cf4f', 'ACTIVE', '2026-08-07 05:41:10.786', NULL);
INSERT INTO public.enrollments VALUES ('4071c172-13e6-439d-8396-554787244583', '42001a2c-a4a2-4e6d-90ff-5fe06b87eafb', '728458ba-9d85-4294-b8dc-2eb9360ae9ec', '7924cd79-eca3-41d2-a229-faca4925b80f', 'ACTIVE', '2026-08-08 11:36:24.507', NULL);
INSERT INTO public.enrollments VALUES ('e23b4fae-6452-4c5b-bc8f-0c32bc5c2318', '7d084b5b-4fa7-458b-9ebb-ab08f785de31', '728458ba-9d85-4294-b8dc-2eb9360ae9ec', '389ec8e9-ca7c-4804-9f34-06701bd79093', 'ACTIVE', '2026-08-08 15:56:31.793', NULL);


--
-- TOC entry 3908 (class 0 OID 17599)
-- Dependencies: 314
-- Data for Name: lessons; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.lessons VALUES ('263ad238-6ea3-46d8-aa3b-05ff35305f85', '17604833-de29-4303-a9cd-1efff4f43ea2', 'áda', 'ád', 0, false, NULL, NULL, NULL, 'NO_VIDEO', NULL, '2026-07-23 17:01:00.466', '2026-07-23 17:03:03.483');
INSERT INTO public.lessons VALUES ('c2b1e45e-35a6-4876-9cef-abdc690d6425', 'a2027eb3-b954-4b07-8888-2a5bab351c66', 'Giới thiệu về Express JS', 'Giới thiệu cơ bản về Express JS, tạo server với expressJS', 0, true, 'MyCsyUcmU4QvAWMnNeHO2CCY49uLGdCBb2Jg2oBmLnM', 'Vn3zhk1RbCAytGK4024RJCPqfN1wK01oYt00UHhz5FkEp8', '1f01ql7cs84RymMSnNbHYb00mW4gXWR00RbfHpoO5MT5do', 'READY', 4064, '2026-07-10 10:55:20.532', '2026-07-24 10:22:19.747');
INSERT INTO public.lessons VALUES ('97c8461f-fb5c-44e2-920f-9856a3e9b98d', '69f4e969-78af-4451-a90c-f9093b7dcc2a', 'Các loại góc', 'I. Kiến thức cần nhớ

1. Định nghĩa tứ giác

Các dạng bài tập về góc trong tứ giác và cách giải 

+ Tứ giác ABCD là hình gồm bốn đoạn thẳng AB, BC, CD, DA trong đó bất kì hai đoạn thẳng nào cũng không cùng nằm trên một đường thẳng.

+ Tứ giác ABCD trên gọi là tứ giác lồi.

+ Tứ giác lồi là tứ giác luôn nằm trong một nửa mặt phẳng có bờ là đường thẳng chứa bất kì cạnh nào của tứ giác.

Chú ý: Nếu chỉ nhắc đến tứ giác, ta hiểu đó là tứ giác lồi.

2. Tính chất của tứ giác

Các dạng bài tập về góc trong tứ giác và cách giải

a) Tính chất đường chéo

Người ta chứng minh được rằng:

+ Trong một tứ giác lồi, hai đường chéo cắt nhau tại một điểm thuộc miền trong của tứ giác.

+ Ngược lại, nếu một tứ giác có hai đường chéo cắt nhau tại một điểm thuộc miền trong của nó thì tứ giác ấy là tứ giác lồi.

b) Tính chất góc

Định lý: Tổng các góc của một tứ giác bằng 3600 .

Các dạng bài tập về góc trong tứ giác và cách giải 

Tứ giác ABCD có: Các dạng bài tập về góc trong tứ giác và cách giải

Chú ý: Góc ngoài của tứ giác là góc kề bù với một góc của tứ giác. 

Các dạng bài tập về góc trong tứ giác và cách giải

Góc CBx là góc ngoài tại đỉnh B của tứ giác ABCD nên Các dạng bài tập về góc trong tứ giác và cách giải', 0, false, 'hjE2fcn5WSwZwMmQiievbPkXGI7sm7QRIf4Z2PbmYlE', 'DUmT2a3JCXR5zM8RbQn9a5TNBM7ieYNm12CL9goC8GE', 'gWJZ9FAwTFfRJmv2T1hN6bI5e1Wk9ueNZXvacbdhS3s', 'READY', 3382, '2026-07-18 14:13:30.751', '2026-07-18 15:39:49.925');
INSERT INTO public.lessons VALUES ('e65412df-f2fa-4ab9-b84a-e798a36c31e6', '61c5940f-47a5-40c9-a319-03ecc36b225d', 'đơn thức, đa thức???', 'ôn tập lại đơn thức và đa thức', 0, true, 'lxB0069kVsfNUYgUHmbJqB01MMl8oLQpKS8BKWEwLNqF4', 'ULPri2c01wskZycesL2RtggWhr7KPjvMUBGLVmwPPWvY', 'erpGZLhTAvdx4dm00ex4VqSy01ZGKotmWvPAGN2ztTalg', 'READY', 2554, '2026-07-10 10:23:15.257', '2026-07-24 10:25:42.067');
INSERT INTO public.lessons VALUES ('d110ed3c-dafe-471a-bbb5-ee7aa221ac2e', 'fb07fcd7-3c44-41e2-9fc9-1fc9f928bfb8', 'Tất Tần Tật Về Cấu Trúc Dữ Liệu', 'Mảng, danh sách liên kết, ngăn xếp, hàng đợi, bảng băm, cây tìm kiếm nhị phân, cây AVL, cây đỏ đen, heap, đồ thị, trie, union-find, skip list, bloom filter, cây B, LSM-Tree.

16 cấu trúc, mỗi cấu trúc trả lời một câu hỏi riêng. Video này đi hết từ cái cơ bản nhất tới cái chỉ gặp trong hệ thống lớn, kèm mốc lịch sử ra đời và độ phức tạp Big-O của từng cái. Kết thúc bằng một khung để chọn nhanh: việc đang cần làm khớp với cấu trúc nào.

Mốc thời gian:
00:00 - Giới thiệu về cấu trúc dữ liệu
01:09 - Big O Notation: Thước đo tốc độ thuật toán
02:47 - Lịch sử 70 năm phát triển của cấu trúc dữ liệu
04:55 - Mảng (Array): Khởi nguồn từ năm 1945
06:23 - Danh sách liên kết (Linked List)
07:52 - Ngăn xếp (Stack): Nguyên tắc "vào sau ra trước"
09:30 - Hàng đợi (Queue): Nguyên tắc "vào trước ra trước"
10:46 - Bảng băm (Hash Table): Tra cứu theo khóa
12:26 - Cây tìm kiếm nhị phân (Binary Search Tree)
13:53 - Cây tự cân bằng (AVL Tree & Red-Black Tree)
15:58 - Heap: Cấu trúc ưu tiên
17:38 - Đồ thị (Graph): Duyệt theo tầng (BFS) và theo chiều sâu (DFS)
20:23 - Trie: Cấu trúc rẽ nhánh theo ký tự (Gợi ý từ khóa)
22:20 - Union-Find: Quản lý nhóm rời rạc
24:32 - Skip List & Bloom Filter: Tốc độ và sự đánh đổi
27:05 - Cây B (B-Tree) & LSM Tree: Lưu trữ dữ liệu quy mô lớn
29:18 - Tổng kết và hướng dẫn chọn cấu trúc dữ liệu phù hợp
31:04 - Kết thúc video', 0, true, '00BA4FDsmhoYfoQMsFtD3nmrTKx6aecdHGZNpO1oo9AA', 'aYsdkbI8nedZtd00AgNMFShFnLKOCkoAbAg8M3026ylk00', '1rhJR01ZWz5tAggcztEG02NWx012RouOBL1XgoqTnUH9kA', 'READY', 1942, '2026-07-24 10:32:01.161', '2026-07-24 11:13:07.996');
INSERT INTO public.lessons VALUES ('81a981fd-076e-404e-b2f2-7b12c31f84d5', '90f8bdc6-dd9a-4463-ae64-2f0bf6cfab39', 'Tổng Quan Về Cơ Sở Dữ Liệu', 'Cơ sở dữ liệu, SQL và NoSQL — tất cả gói gọn trong một video, giải thích từ đầu theo cách dễ hiểu nhất. Từ mô hình quan hệ của Codd (1970), ACID, chỉ mục cây B, đến 4 họ NoSQL lớn (key-value, document, column-family, graph), định lý CAP, NewSQL và cả vector database của kỷ nguyên AI.

Xem xong bạn sẽ tự trả lời được: dự án của mình nên chọn SQL hay NoSQL?

Mốc thời gian:
00:00 - Giới thiệu về khái niệm Cơ sở dữ liệu (Database)
01:05 - Hệ quản trị cơ sở dữ liệu (DBMS) là gì?
02:12 - Lịch sử ra đời của SQL và mô hình quan hệ
03:43 - Khóa chính (Primary Key) và Khóa ngoại (Foreign Key)
04:35 - Cách hoạt động của ngôn ngữ truy vấn SQL
05:44 - Nguyên tắc ACID trong giao dịch dữ liệu
06:59 - Tại sao cần Chỉ mục (Index) và Cây B (B-Tree)?
08:10 - Sự bùng nổ của dữ liệu và nhu cầu Scale Out
09:31 - Định lý CAP và sự xuất hiện của NoSQL
10:47 - Triết lý ACID vs. Triết lý BASE
12:04 - Nhóm Key-Value (Ví dụ: Redis, DynamoDB)
13:12 - Nhóm Document (Ví dụ: MongoDB)
14:29 - Nhóm Column Family (Ví dụ: Cassandra)
15:51 - Nhóm Graph - Đồ thị (Ví dụ: Neo4j)
17:30 - Xu hướng mới: NewSQL và Vector Database
19:21 - Cách chọn loại Database phù hợp cho dự án
20:41 - Tổng kết và triết lý Polyglot Persistence', 0, false, 'wP2xPyq1mk7Nw1bNO4NWye9qyjVRxPGUPLmlBrOVLRk', 'ut4Dj4EoLmNS02jbHX027wQu3sLjyqlNhct00Ooet1UNbE', 'dEqYt00eColgTzLocaDMlGWmQ63k4cLI3UHKfFyR4ZDE', 'READY', 1325, '2026-07-23 16:43:56.566', '2026-07-24 10:33:33.379');
INSERT INTO public.lessons VALUES ('8414f5b4-148c-4384-8b8d-12c1ca30553a', 'b2b49fc6-7c2e-41d9-b2ef-db94f57e4fe8', '1', '1', 0, true, 'Qsn007jVOAN8dLg1jn5Mw2IWzi1YEJJ02ZMTZ51dPGDao', '2W9lB81VYqQCGORYSPYPtJG02YehCAusLPlVjUs7uCi8', 'xIzo7ir5PRGvQgslL2Zqse2pmlpS29i8ZVfWB3v01mXk', 'READY', 157, '2026-08-08 15:54:18.605', '2026-08-08 15:54:18.605');


--
-- TOC entry 3909 (class 0 OID 17606)
-- Dependencies: 315
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.order_items VALUES ('5f76da86-89f9-4670-8a35-43d6583748ab', 'd0384d04-6b93-49c1-9f87-46c6ffe130cd', 'a5bab279-9fec-472d-bcd7-6c93e0942a02', 250000.00, '3289f2bd-8732-4ac5-8d0b-ac15bd94f6a6', 62500.00, 187500.00);
INSERT INTO public.order_items VALUES ('9efa7b99-d6c9-4e39-8602-b590f2d084f6', '8ec1abcb-ab62-4df2-b2d4-b011827c63f7', 'a5bab279-9fec-472d-bcd7-6c93e0942a02', 250000.00, NULL, 0.00, 250000.00);
INSERT INTO public.order_items VALUES ('60593c6a-4671-4b33-aece-4bad9cf6ead6', '5e51d8a8-122e-407c-bc70-a4e3b0e129bb', 'a5bab279-9fec-472d-bcd7-6c93e0942a02', 250000.00, NULL, 0.00, 250000.00);
INSERT INTO public.order_items VALUES ('efedd920-e02f-40cb-b07a-6049f71c3ef0', 'f0720928-29e7-4f3c-90fb-52b3107cbd33', 'a5bab279-9fec-472d-bcd7-6c93e0942a02', 250000.00, NULL, 0.00, 250000.00);
INSERT INTO public.order_items VALUES ('02ebce9b-5bb8-4ee1-be94-1f35282d51d3', '374087d2-5bc2-48c9-89ca-d2da68b5776d', 'a5bab279-9fec-472d-bcd7-6c93e0942a02', 250000.00, '3289f2bd-8732-4ac5-8d0b-ac15bd94f6a6', 62500.00, 187500.00);
INSERT INTO public.order_items VALUES ('3d7400f7-9d25-4d56-af62-9fb2ecfd5f46', 'b4517e17-9de3-401d-aa4f-aac6d6f25188', 'aee3fe53-e209-4ca6-a6c1-1aaf264ecec2', 150000.00, NULL, 0.00, 150000.00);
INSERT INTO public.order_items VALUES ('0542974d-cca1-4ede-a1ba-5d914146e227', 'b4517e17-9de3-401d-aa4f-aac6d6f25188', '6b1686b8-f8af-4f62-a3f9-887e3c533036', 150000.00, NULL, 0.00, 150000.00);
INSERT INTO public.order_items VALUES ('435a2fa5-1aa3-4616-b920-1a444bbd1556', 'ae6a2930-b7dd-40bc-9e14-dffa40fd0df7', 'aee3fe53-e209-4ca6-a6c1-1aaf264ecec2', 150000.00, NULL, 0.00, 150000.00);
INSERT INTO public.order_items VALUES ('e881007e-6edc-4777-a1c3-9020413a55a0', '170a4a9d-39c7-4723-b7d3-6a3bd2c30e9a', '6b1686b8-f8af-4f62-a3f9-887e3c533036', 150000.00, NULL, 0.00, 150000.00);
INSERT INTO public.order_items VALUES ('d12607c3-140c-4f03-a43a-0ffe30e7b4ba', '86ca1e00-95be-459b-a72c-26791da62ec8', 'a8ec8846-a349-4598-86f8-5aa466708183', 123000.00, '3289f2bd-8732-4ac5-8d0b-ac15bd94f6a6', 30750.00, 92250.00);
INSERT INTO public.order_items VALUES ('014ada87-bacd-4e21-85d9-2771de269e90', '6ae0d085-ba32-4bfc-b546-9d1a71c3607b', 'a8ec8846-a349-4598-86f8-5aa466708183', 123000.00, '3289f2bd-8732-4ac5-8d0b-ac15bd94f6a6', 30750.00, 92250.00);
INSERT INTO public.order_items VALUES ('72a00dd6-a18d-4cdb-b8e6-98cfa25678cb', '6ae0d085-ba32-4bfc-b546-9d1a71c3607b', 'fafed130-10a6-4315-b006-3ce862dfd27f', 500000.00, '3289f2bd-8732-4ac5-8d0b-ac15bd94f6a6', 125000.00, 375000.00);
INSERT INTO public.order_items VALUES ('52327135-40a9-446c-bb9d-663b65107aea', 'c11cc906-5c1e-45d2-be48-f1e0425ca5bf', '89fab445-349e-428a-87e7-e821052bbbdb', 123000.00, '3289f2bd-8732-4ac5-8d0b-ac15bd94f6a6', 30750.00, 92250.00);
INSERT INTO public.order_items VALUES ('a4b8ce89-b37a-4c38-876b-10c22bc66551', '048023bd-312a-4dd8-bc23-f74763cbe1dd', '89fab445-349e-428a-87e7-e821052bbbdb', 123000.00, '3289f2bd-8732-4ac5-8d0b-ac15bd94f6a6', 30750.00, 92250.00);
INSERT INTO public.order_items VALUES ('1af2e10a-8ac7-48dd-b49d-ae6c8cf6ec3c', 'a7669d46-ce5d-484f-976b-ee1df80b0ffb', '89fab445-349e-428a-87e7-e821052bbbdb', 123000.00, '3289f2bd-8732-4ac5-8d0b-ac15bd94f6a6', 30750.00, 92250.00);
INSERT INTO public.order_items VALUES ('7504cde4-888c-4c6c-b288-dcf4bdd56db1', '1ce63d92-0d84-47fd-95b9-99ce1a889a83', '89fab445-349e-428a-87e7-e821052bbbdb', 123000.00, '3289f2bd-8732-4ac5-8d0b-ac15bd94f6a6', 30750.00, 92250.00);
INSERT INTO public.order_items VALUES ('d1a4969f-190b-4857-85b1-e17edae5afc7', '001d6829-b62e-4aed-850d-07d5e7ff6cd6', '89fab445-349e-428a-87e7-e821052bbbdb', 123000.00, '3289f2bd-8732-4ac5-8d0b-ac15bd94f6a6', 30750.00, 92250.00);
INSERT INTO public.order_items VALUES ('88bad28e-5945-4332-8b12-bc94889b8387', 'be4bb13d-968f-46b4-be52-1f1bab6f2483', 'e2e2b733-4bc4-47f4-ba55-e0f77992d3c8', 12000.00, '3289f2bd-8732-4ac5-8d0b-ac15bd94f6a6', 3000.00, 9000.00);
INSERT INTO public.order_items VALUES ('4cb060cf-93c8-4047-aeeb-1345629e2e7c', 'f242b1a1-0908-482b-bd03-1098b3b1f4fc', 'e2e2b733-4bc4-47f4-ba55-e0f77992d3c8', 12000.00, '3289f2bd-8732-4ac5-8d0b-ac15bd94f6a6', 3000.00, 9000.00);
INSERT INTO public.order_items VALUES ('4888a594-9501-4d18-b3d5-0c8bb3b2cf6f', '866b7dc3-2751-429f-93d3-a8d32e2fdd99', 'e2e2b733-4bc4-47f4-ba55-e0f77992d3c8', 12000.00, '3289f2bd-8732-4ac5-8d0b-ac15bd94f6a6', 3000.00, 9000.00);
INSERT INTO public.order_items VALUES ('38025e94-6a19-49a7-ac1d-93b76a2b4379', '829ccce2-9196-4782-ae09-1ab8b001f190', 'f8fff5ea-4441-4b5b-9ac5-e7105501701a', 14000.00, NULL, 0.00, 14000.00);
INSERT INTO public.order_items VALUES ('8249a243-734f-4719-ba16-8ec98013fa8f', '829ccce2-9196-4782-ae09-1ab8b001f190', '506763ac-c809-442d-9073-c07979bfda33', 55000.00, NULL, 0.00, 55000.00);
INSERT INTO public.order_items VALUES ('64687434-85e8-4472-b652-33aa0879d1f6', '829ccce2-9196-4782-ae09-1ab8b001f190', 'c35d5069-d169-4448-8372-03dfcc35a137', 55000.00, NULL, 0.00, 55000.00);
INSERT INTO public.order_items VALUES ('c518ada0-97e6-47ac-9c05-a10a42371c3a', '0cd8b9fe-e60a-483c-b88a-f77fd04a9456', 'e2e2b733-4bc4-47f4-ba55-e0f77992d3c8', 12000.00, '3289f2bd-8732-4ac5-8d0b-ac15bd94f6a6', 3000.00, 9000.00);
INSERT INTO public.order_items VALUES ('d4724f24-e6f2-46d8-bf1c-3b47deffdc8e', '3c644650-b601-4bc1-b8e7-0bb2cd8c6a6b', '89fab445-349e-428a-87e7-e821052bbbdb', 123000.00, '3289f2bd-8732-4ac5-8d0b-ac15bd94f6a6', 30750.00, 92250.00);
INSERT INTO public.order_items VALUES ('2f75420d-f6ea-46b2-bf3b-bb1530d27159', 'cfa52578-da64-4cc2-85b2-09b403e77da3', '89fab445-349e-428a-87e7-e821052bbbdb', 123000.00, '31390d44-9193-432c-bbf4-080d90786ede', 30750.00, 92250.00);
INSERT INTO public.order_items VALUES ('3ba3327a-eb9c-4342-8940-c956408b9868', 'c2965541-a2ea-4d04-8757-3a7eec71d73a', 'e2e2b733-4bc4-47f4-ba55-e0f77992d3c8', 12000.00, '3289f2bd-8732-4ac5-8d0b-ac15bd94f6a6', 3000.00, 9000.00);
INSERT INTO public.order_items VALUES ('0b8e720d-6e38-4ecc-8144-8730f3bbcef1', 'ad664330-0e0a-4ed6-9b1c-91ee2842e2f4', 'f8fff5ea-4441-4b5b-9ac5-e7105501701a', 14000.00, NULL, 0.00, 14000.00);
INSERT INTO public.order_items VALUES ('fdf98b2f-9f3b-42a7-8211-b8ce27d24e31', '5c7681a8-e009-402e-bbb9-59d9082b8edc', 'f8fff5ea-4441-4b5b-9ac5-e7105501701a', 14000.00, NULL, 0.00, 14000.00);
INSERT INTO public.order_items VALUES ('77fd6ad8-ec59-48fa-b76b-32fc53aab3ce', '5c7681a8-e009-402e-bbb9-59d9082b8edc', '506763ac-c809-442d-9073-c07979bfda33', 55000.00, NULL, 0.00, 55000.00);
INSERT INTO public.order_items VALUES ('31157dce-aa7d-44b7-966b-fe451808d5b3', '5c7681a8-e009-402e-bbb9-59d9082b8edc', 'c35d5069-d169-4448-8372-03dfcc35a137', 55000.00, NULL, 0.00, 55000.00);
INSERT INTO public.order_items VALUES ('cb4ffe86-d3c3-486c-a52c-455378454671', '25ac2c71-1b20-4a9f-b1ea-35e288cf1c85', '6b1686b8-f8af-4f62-a3f9-887e3c533036', 150000.00, '31390d44-9193-432c-bbf4-080d90786ede', 37500.00, 112500.00);
INSERT INTO public.order_items VALUES ('feee2fd8-fd92-4526-b34a-87333465201f', '8a06eadd-062a-4064-8af1-a3026bc7aeb2', 'e2e2b733-4bc4-47f4-ba55-e0f77992d3c8', 12000.00, '3289f2bd-8732-4ac5-8d0b-ac15bd94f6a6', 3000.00, 9000.00);
INSERT INTO public.order_items VALUES ('40ea6694-9b23-47f7-b9ec-a35e7df8cf4f', '866ad1e5-3cd1-4d4f-9645-6491059af2ba', 'e2e2b733-4bc4-47f4-ba55-e0f77992d3c8', 12000.00, '3289f2bd-8732-4ac5-8d0b-ac15bd94f6a6', 3000.00, 9000.00);
INSERT INTO public.order_items VALUES ('7924cd79-eca3-41d2-a229-faca4925b80f', 'eeb670f4-8065-4df5-83ab-e8cfa1f4d262', '728458ba-9d85-4294-b8dc-2eb9360ae9ec', 55000.00, '31390d44-9193-432c-bbf4-080d90786ede', 13750.00, 41250.00);
INSERT INTO public.order_items VALUES ('389ec8e9-ca7c-4804-9f34-06701bd79093', 'fed4952e-2947-4ff6-a1ea-c867b9d9f865', '728458ba-9d85-4294-b8dc-2eb9360ae9ec', 55000.00, '31390d44-9193-432c-bbf4-080d90786ede', 13750.00, 41250.00);


--
-- TOC entry 3910 (class 0 OID 17610)
-- Dependencies: 316
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.orders VALUES ('d0384d04-6b93-49c1-9f87-46c6ffe130cd', '7d084b5b-4fa7-458b-9ebb-ab08f785de31', '3d48cbf0-d835-487e-af9b-a3483104eb7b', 250000.00, 62500.00, 46875.00, 140625.00, 'COMPLETED', '2026-07-10 10:06:53.68', '2026-07-10 10:07:26.834');
INSERT INTO public.orders VALUES ('8ec1abcb-ab62-4df2-b2d4-b011827c63f7', '42001a2c-a4a2-4e6d-90ff-5fe06b87eafb', NULL, 250000.00, 0.00, 0.00, 250000.00, 'FAILED', '2026-07-18 14:06:44.577', '2026-07-18 14:19:25.393');
INSERT INTO public.orders VALUES ('5e51d8a8-122e-407c-bc70-a4e3b0e129bb', '42001a2c-a4a2-4e6d-90ff-5fe06b87eafb', NULL, 250000.00, 0.00, 0.00, 250000.00, 'FAILED', '2026-07-18 14:19:26.149', '2026-07-18 14:34:34.27');
INSERT INTO public.orders VALUES ('f0720928-29e7-4f3c-90fb-52b3107cbd33', '42001a2c-a4a2-4e6d-90ff-5fe06b87eafb', NULL, 250000.00, 0.00, 0.00, 250000.00, 'CANCELLED', '2026-07-18 14:35:04.37', '2026-07-18 14:36:26.668');
INSERT INTO public.orders VALUES ('374087d2-5bc2-48c9-89ca-d2da68b5776d', '42001a2c-a4a2-4e6d-90ff-5fe06b87eafb', '3d48cbf0-d835-487e-af9b-a3483104eb7b', 250000.00, 62500.00, 46875.00, 140625.00, 'COMPLETED', '2026-07-18 15:11:06.533', '2026-07-18 15:14:05.901');
INSERT INTO public.orders VALUES ('b4517e17-9de3-401d-aa4f-aac6d6f25188', '42001a2c-a4a2-4e6d-90ff-5fe06b87eafb', '3d48cbf0-d835-487e-af9b-a3483104eb7b', 300000.00, 0.00, 75000.00, 225000.00, 'FAILED', '2026-07-18 15:16:45.241', '2026-07-18 15:17:41.84');
INSERT INTO public.orders VALUES ('ae6a2930-b7dd-40bc-9e14-dffa40fd0df7', '42001a2c-a4a2-4e6d-90ff-5fe06b87eafb', NULL, 150000.00, 0.00, 0.00, 150000.00, 'COMPLETED', '2026-07-18 15:17:42.806', '2026-07-18 15:18:21.088');
INSERT INTO public.orders VALUES ('170a4a9d-39c7-4723-b7d3-6a3bd2c30e9a', '42001a2c-a4a2-4e6d-90ff-5fe06b87eafb', '3d48cbf0-d835-487e-af9b-a3483104eb7b', 150000.00, 0.00, 37500.00, 112500.00, 'COMPLETED', '2026-07-18 15:19:07.071', '2026-07-18 15:19:47.671');
INSERT INTO public.orders VALUES ('86ca1e00-95be-459b-a72c-26791da62ec8', '42001a2c-a4a2-4e6d-90ff-5fe06b87eafb', '3d48cbf0-d835-487e-af9b-a3483104eb7b', 123000.00, 30750.00, 23062.50, 69187.50, 'CANCELLED', '2026-07-18 15:29:04.135', '2026-07-18 15:29:34.219');
INSERT INTO public.orders VALUES ('6ae0d085-ba32-4bfc-b546-9d1a71c3607b', '42001a2c-a4a2-4e6d-90ff-5fe06b87eafb', '3d48cbf0-d835-487e-af9b-a3483104eb7b', 623000.00, 155750.00, 116812.50, 350437.50, 'COMPLETED', '2026-07-18 15:36:24.276', '2026-07-18 15:37:09.443');
INSERT INTO public.orders VALUES ('c11cc906-5c1e-45d2-be48-f1e0425ca5bf', '7d084b5b-4fa7-458b-9ebb-ab08f785de31', NULL, 123000.00, 30750.00, 0.00, 92250.00, 'CANCELLED', '2026-07-23 03:30:30.455', '2026-07-23 03:30:37.236');
INSERT INTO public.orders VALUES ('048023bd-312a-4dd8-bc23-f74763cbe1dd', '42001a2c-a4a2-4e6d-90ff-5fe06b87eafb', NULL, 123000.00, 30750.00, 0.00, 92250.00, 'CANCELLED', '2026-07-23 11:07:23.392', '2026-07-23 11:07:39.392');
INSERT INTO public.orders VALUES ('a7669d46-ce5d-484f-976b-ee1df80b0ffb', '42001a2c-a4a2-4e6d-90ff-5fe06b87eafb', NULL, 123000.00, 30750.00, 0.00, 92250.00, 'CANCELLED', '2026-07-23 11:08:54.289', '2026-07-23 11:09:45.316');
INSERT INTO public.orders VALUES ('1ce63d92-0d84-47fd-95b9-99ce1a889a83', '42001a2c-a4a2-4e6d-90ff-5fe06b87eafb', NULL, 123000.00, 30750.00, 0.00, 92250.00, 'FAILED', '2026-07-23 13:47:20.563', '2026-07-23 13:51:02.504');
INSERT INTO public.orders VALUES ('001d6829-b62e-4aed-850d-07d5e7ff6cd6', '42001a2c-a4a2-4e6d-90ff-5fe06b87eafb', NULL, 123000.00, 30750.00, 0.00, 92250.00, 'COMPLETED', '2026-07-23 13:51:03.139', '2026-07-23 13:55:15.696');
INSERT INTO public.orders VALUES ('be4bb13d-968f-46b4-be52-1f1bab6f2483', '42001a2c-a4a2-4e6d-90ff-5fe06b87eafb', NULL, 12000.00, 3000.00, 0.00, 9000.00, 'FAILED', '2026-07-23 14:10:52.996', '2026-07-23 14:11:27.271');
INSERT INTO public.orders VALUES ('f242b1a1-0908-482b-bd03-1098b3b1f4fc', '42001a2c-a4a2-4e6d-90ff-5fe06b87eafb', NULL, 12000.00, 3000.00, 0.00, 9000.00, 'FAILED', '2026-07-23 14:11:27.965', '2026-07-23 15:42:09.135');
INSERT INTO public.orders VALUES ('829ccce2-9196-4782-ae09-1ab8b001f190', '42001a2c-a4a2-4e6d-90ff-5fe06b87eafb', NULL, 124000.00, 0.00, 0.00, 124000.00, 'COMPLETED', '2026-07-23 15:43:13.975', '2026-07-23 15:44:01.468');
INSERT INTO public.orders VALUES ('866b7dc3-2751-429f-93d3-a8d32e2fdd99', '42001a2c-a4a2-4e6d-90ff-5fe06b87eafb', NULL, 12000.00, 3000.00, 0.00, 9000.00, 'CANCELLED', '2026-07-23 15:42:09.85', '2026-07-23 15:59:59.213');
INSERT INTO public.orders VALUES ('0cd8b9fe-e60a-483c-b88a-f77fd04a9456', '42001a2c-a4a2-4e6d-90ff-5fe06b87eafb', NULL, 12000.00, 3000.00, 0.00, 9000.00, 'COMPLETED', '2026-07-23 16:02:51.878', '2026-07-23 19:38:40.056');
INSERT INTO public.orders VALUES ('3c644650-b601-4bc1-b8e7-0bb2cd8c6a6b', '7d084b5b-4fa7-458b-9ebb-ab08f785de31', NULL, 123000.00, 30750.00, 0.00, 92250.00, 'CANCELLED', '2026-07-23 21:45:14.086', '2026-07-23 21:45:50.735');
INSERT INTO public.orders VALUES ('c2965541-a2ea-4d04-8757-3a7eec71d73a', '7d084b5b-4fa7-458b-9ebb-ab08f785de31', NULL, 12000.00, 3000.00, 0.00, 9000.00, 'CANCELLED', '2026-07-24 11:22:38.621', '2026-07-24 11:23:41.452');
INSERT INTO public.orders VALUES ('cfa52578-da64-4cc2-85b2-09b403e77da3', '7d084b5b-4fa7-458b-9ebb-ab08f785de31', '3d48cbf0-d835-487e-af9b-a3483104eb7b', 123000.00, 30750.00, 23062.50, 69187.50, 'COMPLETED', '2026-07-24 11:17:44.425', '2026-07-24 11:24:30.031');
INSERT INTO public.orders VALUES ('ad664330-0e0a-4ed6-9b1c-91ee2842e2f4', '7d084b5b-4fa7-458b-9ebb-ab08f785de31', '3d48cbf0-d835-487e-af9b-a3483104eb7b', 14000.00, 0.00, 3500.00, 10500.00, 'FAILED', '2026-08-06 16:43:16.949', '2026-08-06 16:44:53.971');
INSERT INTO public.orders VALUES ('5c7681a8-e009-402e-bbb9-59d9082b8edc', '7d084b5b-4fa7-458b-9ebb-ab08f785de31', '3d48cbf0-d835-487e-af9b-a3483104eb7b', 124000.00, 0.00, 31000.00, 93000.00, 'CANCELLED', '2026-08-06 16:44:55.067', '2026-08-06 16:45:10.145');
INSERT INTO public.orders VALUES ('25ac2c71-1b20-4a9f-b1ea-35e288cf1c85', '7d084b5b-4fa7-458b-9ebb-ab08f785de31', '3d48cbf0-d835-487e-af9b-a3483104eb7b', 150000.00, 37500.00, 28125.00, 84375.00, 'COMPLETED', '2026-08-06 16:46:27.773', '2026-08-06 16:47:59.588');
INSERT INTO public.orders VALUES ('8a06eadd-062a-4064-8af1-a3026bc7aeb2', '7d084b5b-4fa7-458b-9ebb-ab08f785de31', '3d48cbf0-d835-487e-af9b-a3483104eb7b', 12000.00, 3000.00, 2250.00, 6750.00, 'CANCELLED', '2026-08-07 05:39:09.304', '2026-08-07 05:40:18.74');
INSERT INTO public.orders VALUES ('866ad1e5-3cd1-4d4f-9645-6491059af2ba', '7d084b5b-4fa7-458b-9ebb-ab08f785de31', NULL, 12000.00, 3000.00, 0.00, 9000.00, 'COMPLETED', '2026-08-07 05:40:31.299', '2026-08-07 05:41:10.244');
INSERT INTO public.orders VALUES ('eeb670f4-8065-4df5-83ab-e8cfa1f4d262', '42001a2c-a4a2-4e6d-90ff-5fe06b87eafb', '3d48cbf0-d835-487e-af9b-a3483104eb7b', 55000.00, 13750.00, 10312.50, 30937.50, 'COMPLETED', '2026-08-08 11:35:34.191', '2026-08-08 11:36:23.683');
INSERT INTO public.orders VALUES ('fed4952e-2947-4ff6-a1ea-c867b9d9f865', '7d084b5b-4fa7-458b-9ebb-ab08f785de31', NULL, 55000.00, 13750.00, 0.00, 41250.00, 'COMPLETED', '2026-08-08 15:56:04.297', '2026-08-08 15:56:31.15');


--
-- TOC entry 3911 (class 0 OID 17616)
-- Dependencies: 317
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.payments VALUES ('f6dc6c31-dc1a-4116-9599-2e76d674be82', 'd0384d04-6b93-49c1-9f87-46c6ffe130cd', 'VNPAY', '15616653', 140625.00, 'SUCCESS', '2026-07-10 10:07:27.329', '2026-07-10 10:06:54.82');
INSERT INTO public.payments VALUES ('ede8cd0f-c6a5-4287-af61-f139c9865715', '8ec1abcb-ab62-4df2-b2d4-b011827c63f7', 'VNPAY', NULL, 250000.00, 'FAILED', NULL, '2026-07-18 14:06:45.702');
INSERT INTO public.payments VALUES ('5e07a357-458a-4403-91be-ae7b62ad266a', '5e51d8a8-122e-407c-bc70-a4e3b0e129bb', 'VNPAY', '0', 250000.00, 'FAILED', NULL, '2026-07-18 14:19:27.581');
INSERT INTO public.payments VALUES ('0944c0c8-4ca5-4dde-811b-79fa406d0232', 'f0720928-29e7-4f3c-90fb-52b3107cbd33', 'VNPAY', NULL, 250000.00, 'FAILED', NULL, '2026-07-18 14:35:14.607');
INSERT INTO public.payments VALUES ('abfb1cf4-cb43-4846-b143-07e4d48f7920', '374087d2-5bc2-48c9-89ca-d2da68b5776d', 'VNPAY', '15626424', 140625.00, 'SUCCESS', '2026-07-18 15:14:06.47', '2026-07-18 15:13:19.877');
INSERT INTO public.payments VALUES ('a5e42f16-d1ec-4f04-81fe-44480b6cbc02', 'b4517e17-9de3-401d-aa4f-aac6d6f25188', 'VNPAY', NULL, 225000.00, 'FAILED', NULL, '2026-07-18 15:17:05.084');
INSERT INTO public.payments VALUES ('bff40758-f2f7-4f39-a6f2-59fa1c5548c4', 'ae6a2930-b7dd-40bc-9e14-dffa40fd0df7', 'VNPAY', '15626430', 150000.00, 'SUCCESS', '2026-07-18 15:18:21.61', '2026-07-18 15:17:50.368');
INSERT INTO public.payments VALUES ('cff0dead-ea47-4744-9bc7-22f2c3aa3244', '170a4a9d-39c7-4723-b7d3-6a3bd2c30e9a', 'VNPAY', '15626431', 112500.00, 'SUCCESS', '2026-07-18 15:19:48.229', '2026-07-18 15:19:18.509');
INSERT INTO public.payments VALUES ('e1f710ea-729d-46f4-abd6-b49c4cbacbd1', '6ae0d085-ba32-4bfc-b546-9d1a71c3607b', 'VNPAY', '15626442', 350437.50, 'SUCCESS', '2026-07-18 15:37:10.43', '2026-07-18 15:36:33.073');
INSERT INTO public.payments VALUES ('6f9ab81c-55ca-482f-b9c1-8b8c6bf0a100', 'a7669d46-ce5d-484f-976b-ee1df80b0ffb', 'VNPAY', NULL, 92250.00, 'FAILED', NULL, '2026-07-23 11:09:37.623');
INSERT INTO public.payments VALUES ('0c578761-c373-40dd-89f0-d9746880aaf5', '001d6829-b62e-4aed-850d-07d5e7ff6cd6', 'VNPAY', '15633327', 92250.00, 'SUCCESS', '2026-07-23 13:55:16.071', '2026-07-23 13:54:30.827');
INSERT INTO public.payments VALUES ('079f1006-9066-4adc-83ef-3e514e1fafe0', 'be4bb13d-968f-46b4-be52-1f1bab6f2483', 'VNPAY', NULL, 9000.00, 'FAILED', NULL, '2026-07-23 14:10:56.064');
INSERT INTO public.payments VALUES ('e06eee78-5e96-4879-b381-6c86a9af2965', 'f242b1a1-0908-482b-bd03-1098b3b1f4fc', 'VNPAY', NULL, 9000.00, 'FAILED', NULL, '2026-07-23 14:11:31.559');
INSERT INTO public.payments VALUES ('9b2bb0d6-c3a7-4966-bd94-737312554d40', '829ccce2-9196-4782-ae09-1ab8b001f190', 'VNPAY', '15633444', 124000.00, 'SUCCESS', '2026-07-23 15:44:01.895', '2026-07-23 15:43:17.559');
INSERT INTO public.payments VALUES ('84c86a1a-9554-4a56-a435-bdd91b4895d3', '0cd8b9fe-e60a-483c-b88a-f77fd04a9456', 'ADMIN_MANUAL', NULL, 9000.00, 'SUCCESS', '2026-07-23 19:38:40.814', '2026-07-23 19:38:40.814');
INSERT INTO public.payments VALUES ('a7a97af6-6332-426b-89ee-dc7bc412cd4b', 'c2965541-a2ea-4d04-8757-3a7eec71d73a', 'VNPAY', NULL, 9000.00, 'FAILED', NULL, '2026-07-24 11:22:43.23');
INSERT INTO public.payments VALUES ('931e8ef9-91f6-4839-b21f-87257c88a8ae', 'c2965541-a2ea-4d04-8757-3a7eec71d73a', 'VNPAY', NULL, 9000.00, 'FAILED', NULL, '2026-07-24 11:23:31.821');
INSERT INTO public.payments VALUES ('1aff2d05-5df1-4a1a-b200-d5e9696a172f', 'cfa52578-da64-4cc2-85b2-09b403e77da3', 'VNPAY', '15634335', 69187.50, 'SUCCESS', '2026-07-24 11:24:30.531', '2026-07-24 11:21:56.543');
INSERT INTO public.payments VALUES ('3e4cd2b8-53fb-4cc4-881f-4b191462fda3', '25ac2c71-1b20-4a9f-b1ea-35e288cf1c85', 'VNPAY', '15648964', 84375.00, 'SUCCESS', '2026-08-06 16:48:00.132', '2026-08-06 16:46:49.13');
INSERT INTO public.payments VALUES ('8286a263-d7a1-4937-94e6-b85b8a367738', '25ac2c71-1b20-4a9f-b1ea-35e288cf1c85', 'VNPAY', NULL, 84375.00, 'FAILED', NULL, '2026-08-06 16:47:09.067');
INSERT INTO public.payments VALUES ('943a9d98-bcf7-4cb4-ad33-46a802060d7f', 'cfa52578-da64-4cc2-85b2-09b403e77da3', 'VNPAY', NULL, 69187.50, 'FAILED', NULL, '2026-07-24 11:24:00.324');
INSERT INTO public.payments VALUES ('11b30311-1783-4b02-9028-a6dd0303b06c', '8a06eadd-062a-4064-8af1-a3026bc7aeb2', 'VNPAY', NULL, 6750.00, 'FAILED', NULL, '2026-08-07 05:39:12.403');
INSERT INTO public.payments VALUES ('39ae807b-6dd6-4d80-8f7d-813cc202ad71', '8a06eadd-062a-4064-8af1-a3026bc7aeb2', 'VNPAY', NULL, 6750.00, 'FAILED', NULL, '2026-08-07 05:40:08.059');
INSERT INTO public.payments VALUES ('b2677a43-2cf9-4f0b-bd1a-5de9b5bd7870', '866ad1e5-3cd1-4d4f-9645-6491059af2ba', 'VNPAY', NULL, 9000.00, 'SUCCESS', '2026-08-07 05:41:10.569', '2026-08-07 05:40:37.738');
INSERT INTO public.payments VALUES ('ac15aed2-b375-487a-9f1d-70e2112badb3', 'eeb670f4-8065-4df5-83ab-e8cfa1f4d262', 'VNPAY', '15650508', 30937.50, 'SUCCESS', '2026-08-08 11:36:24.093', '2026-08-08 11:35:37.063');
INSERT INTO public.payments VALUES ('dddbb798-cccb-49dc-b7b1-3fca585ad395', 'fed4952e-2947-4ff6-a1ea-c867b9d9f865', 'VNPAY', '15650595', 41250.00, 'SUCCESS', '2026-08-08 15:56:31.578', '2026-08-08 15:56:08.092');


--
-- TOC entry 3912 (class 0 OID 17622)
-- Dependencies: 318
-- Data for Name: promotion_categories; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.promotion_categories VALUES ('3289f2bd-8732-4ac5-8d0b-ac15bd94f6a6', '48fd0e01-cf10-4e89-8700-2378287b9486');
INSERT INTO public.promotion_categories VALUES ('31390d44-9193-432c-bbf4-080d90786ede', '9c512add-03e5-4915-ab82-9b4e856211c8');


--
-- TOC entry 3913 (class 0 OID 17625)
-- Dependencies: 319
-- Data for Name: promotion_courses; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 3914 (class 0 OID 17628)
-- Dependencies: 320
-- Data for Name: promotions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.promotions VALUES ('3289f2bd-8732-4ac5-8d0b-ac15bd94f6a6', 'Vui cùng toán học', 25.00, '2026-07-10 00:00:00', '2026-08-24 00:00:00', true, '904c2dbb-e97d-4f27-ab85-54b621635eca', '2026-07-10 10:03:05.661', '2026-07-24 10:54:08.529');
INSERT INTO public.promotions VALUES ('31390d44-9193-432c-bbf4-080d90786ede', 'CNTT', 25.00, '2026-07-24 00:00:00', '2026-09-24 00:00:00', true, '904c2dbb-e97d-4f27-ab85-54b621635eca', '2026-07-24 11:11:57.558', '2026-07-24 11:11:57.558');


--
-- TOC entry 3915 (class 0 OID 17634)
-- Dependencies: 321
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users VALUES ('7d084b5b-4fa7-458b-9ebb-ab08f785de31', 'Lệ Phi Vũ', 'dlhnguyen29@gmail.com', '$2b$10$RYdyRaoakox1ezc/yx.Rvuqe3UdoUctYHBkJ4xe.99XfZaxY5DsIy', '/uploads/avatars/Lệ_Phi_Vũ.gif', 'STUDENT', 'ACTIVE', '2026-07-10 09:26:01.873', '2026-07-24 19:02:56.032');
INSERT INTO public.users VALUES ('6f729c9b-de6d-480d-add0-3737ea211bb7', 'Nguyên Đoàn', 'dlhnguyen27@gmail.com', '$2b$10$XjA5BfXCNOeSnxYXW/qxleBQshQjCYxswyYKmNU/WBipEMnR5m0.2', NULL, 'INSTRUCTOR', 'ACTIVE', '2026-07-10 09:22:03.787', '2026-07-23 10:21:35.552');
INSERT INTO public.users VALUES ('c7d5a29f-ea71-4fe7-a122-02a3602494f8', 'Thành Long', 'test1@gmail.com', '$2b$10$fuqpZJbeuU88cP1dJaeDD.LhxAmmwlzygIfxmyXIfaN9vDq5YGGPa', NULL, 'STUDENT', 'ACTIVE', '2026-07-18 16:18:13.381', '2026-07-24 10:52:31.385');
INSERT INTO public.users VALUES ('26b6364b-5c02-4147-aa32-7b56b11b181a', 'Thanh Thủy', 'test@gmail.com', '$2b$10$5XRoCUQVf6vZG8EMHmO15OVPsuZAJ0dX6X1.yiuRl4hLtWjdIqxcW', NULL, 'STUDENT', 'ACTIVE', '2026-07-18 16:16:30.226', '2026-07-24 10:52:43.294');
INSERT INTO public.users VALUES ('904c2dbb-e97d-4f27-ab85-54b621635eca', 'Admin', 'dlhnguyen26@gmail.com', '$2b$10$zAaYjziFs4Fz8bB.4ZMxE.Fquq9JrjM2RB.xP3XGZU90ZB6qsMRT6', NULL, 'ADMIN', 'ACTIVE', '2026-07-10 09:24:23.387', '2026-07-24 10:53:15.401');
INSERT INTO public.users VALUES ('42001a2c-a4a2-4e6d-90ff-5fe06b87eafb', 'Đoàn Lê Hoàng Nguyên', 'dlhnguyen@gmail.com', '$2b$10$LLvnwgJY0CAjVpi/N2X.UOTq6K2wujktim0UCRNAJfvFWJN6Sgjoq', '/uploads/avatars/Đoàn_Lê_Hoàng_Nguyên.gif', 'STUDENT', 'ACTIVE', '2026-07-10 11:39:20.728', '2026-07-24 11:05:44.311');
INSERT INTO public.users VALUES ('186daffa-eb1b-46ce-9b95-7d59a5e758c1', 'Mỹ Đình', 'dlhnguyen21@gmail.com', '$2b$10$s2dRgPMuWHAS2F3WpiTtVey1ID1PeRnClW5If8.k/3laluyscJ5O6', '/uploads/avatars/Mỹ_Đình.gif', 'INSTRUCTOR', 'ACTIVE', '2026-08-06 17:12:28.464', '2026-08-08 11:33:57.305');


--
-- TOC entry 3689 (class 2606 OID 17642)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 3692 (class 2606 OID 17644)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 3695 (class 2606 OID 17646)
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);


--
-- TOC entry 3698 (class 2606 OID 17648)
-- Name: course_group_items course_group_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_group_items
    ADD CONSTRAINT course_group_items_pkey PRIMARY KEY (course_group_id, course_id);


--
-- TOC entry 3700 (class 2606 OID 17650)
-- Name: course_groups course_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_groups
    ADD CONSTRAINT course_groups_pkey PRIMARY KEY (id);


--
-- TOC entry 3702 (class 2606 OID 17652)
-- Name: course_sections course_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_sections
    ADD CONSTRAINT course_sections_pkey PRIMARY KEY (id);


--
-- TOC entry 3704 (class 2606 OID 17654)
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- TOC entry 3706 (class 2606 OID 17656)
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);


--
-- TOC entry 3709 (class 2606 OID 17658)
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


--
-- TOC entry 3712 (class 2606 OID 17660)
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- TOC entry 3714 (class 2606 OID 17662)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- TOC entry 3716 (class 2606 OID 17664)
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- TOC entry 3719 (class 2606 OID 17666)
-- Name: promotion_categories promotion_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotion_categories
    ADD CONSTRAINT promotion_categories_pkey PRIMARY KEY (promotion_id, category_id);


--
-- TOC entry 3721 (class 2606 OID 17668)
-- Name: promotion_courses promotion_courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotion_courses
    ADD CONSTRAINT promotion_courses_pkey PRIMARY KEY (promotion_id, course_id);


--
-- TOC entry 3723 (class 2606 OID 17670)
-- Name: promotions promotions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_pkey PRIMARY KEY (id);


--
-- TOC entry 3726 (class 2606 OID 17672)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 3690 (class 1259 OID 17816)
-- Name: categories_parent_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX categories_parent_id_idx ON public.categories USING btree (parent_id);


--
-- TOC entry 3693 (class 1259 OID 17673)
-- Name: coupons_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX coupons_code_key ON public.coupons USING btree (code);


--
-- TOC entry 3696 (class 1259 OID 17674)
-- Name: course_group_items_course_group_id_order_index_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX course_group_items_course_group_id_order_index_idx ON public.course_group_items USING btree (course_group_id, order_index);


--
-- TOC entry 3707 (class 1259 OID 17675)
-- Name: enrollments_student_id_course_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX enrollments_student_id_course_id_idx ON public.enrollments USING btree (student_id, course_id);


--
-- TOC entry 3710 (class 1259 OID 17676)
-- Name: order_items_order_id_course_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX order_items_order_id_course_id_idx ON public.order_items USING btree (order_id, course_id);


--
-- TOC entry 3717 (class 1259 OID 17677)
-- Name: payments_transaction_reference_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX payments_transaction_reference_key ON public.payments USING btree (transaction_reference);


--
-- TOC entry 3724 (class 1259 OID 17678)
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- TOC entry 3727 (class 2606 OID 17817)
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- TOC entry 3728 (class 2606 OID 17679)
-- Name: coupons coupons_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.coupons
    ADD CONSTRAINT coupons_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- TOC entry 3729 (class 2606 OID 17684)
-- Name: course_group_items course_group_items_course_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_group_items
    ADD CONSTRAINT course_group_items_course_group_id_fkey FOREIGN KEY (course_group_id) REFERENCES public.course_groups(id);


--
-- TOC entry 3730 (class 2606 OID 17689)
-- Name: course_group_items course_group_items_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_group_items
    ADD CONSTRAINT course_group_items_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- TOC entry 3731 (class 2606 OID 17694)
-- Name: course_groups course_groups_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_groups
    ADD CONSTRAINT course_groups_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- TOC entry 3732 (class 2606 OID 17699)
-- Name: course_groups course_groups_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_groups
    ADD CONSTRAINT course_groups_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id);


--
-- TOC entry 3733 (class 2606 OID 17704)
-- Name: course_sections course_sections_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_sections
    ADD CONSTRAINT course_sections_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- TOC entry 3734 (class 2606 OID 17709)
-- Name: courses courses_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- TOC entry 3735 (class 2606 OID 17714)
-- Name: courses courses_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.users(id);


--
-- TOC entry 3736 (class 2606 OID 17719)
-- Name: enrollments enrollments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- TOC entry 3737 (class 2606 OID 17724)
-- Name: enrollments enrollments_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id);


--
-- TOC entry 3738 (class 2606 OID 17729)
-- Name: enrollments enrollments_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id);


--
-- TOC entry 3739 (class 2606 OID 17734)
-- Name: lessons lessons_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.course_sections(id);


--
-- TOC entry 3740 (class 2606 OID 17739)
-- Name: order_items order_items_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- TOC entry 3741 (class 2606 OID 17744)
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- TOC entry 3742 (class 2606 OID 17749)
-- Name: order_items order_items_promotion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_promotion_id_fkey FOREIGN KEY (promotion_id) REFERENCES public.promotions(id);


--
-- TOC entry 3743 (class 2606 OID 17754)
-- Name: orders orders_coupon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(id);


--
-- TOC entry 3744 (class 2606 OID 17759)
-- Name: orders orders_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(id);


--
-- TOC entry 3745 (class 2606 OID 17764)
-- Name: payments payments_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- TOC entry 3746 (class 2606 OID 17769)
-- Name: promotion_categories promotion_categories_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotion_categories
    ADD CONSTRAINT promotion_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- TOC entry 3747 (class 2606 OID 17774)
-- Name: promotion_categories promotion_categories_promotion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotion_categories
    ADD CONSTRAINT promotion_categories_promotion_id_fkey FOREIGN KEY (promotion_id) REFERENCES public.promotions(id);


--
-- TOC entry 3748 (class 2606 OID 17779)
-- Name: promotion_courses promotion_courses_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotion_courses
    ADD CONSTRAINT promotion_courses_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- TOC entry 3749 (class 2606 OID 17784)
-- Name: promotion_courses promotion_courses_promotion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotion_courses
    ADD CONSTRAINT promotion_courses_promotion_id_fkey FOREIGN KEY (promotion_id) REFERENCES public.promotions(id);


--
-- TOC entry 3750 (class 2606 OID 17789)
-- Name: promotions promotions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


-- Completed on 2026-08-08 23:35:46

--
-- PostgreSQL database dump complete
--

\unrestrict Pab8QzTzrmU430bx1Gcw0rlKXWWcgUwCespe6Tibjj6H9zV1ThJapCYEeBuqxOy

