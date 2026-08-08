import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { CategoriesModule } from './admin/categories/categories.module';
import { UsersModule } from './admin/users/users.module';
import { ProfileModule } from './profile/profile.module';
import { CourseGroupModule } from './course_group/course_group.module';
import { CourseModule } from './course/course.module';
import { CourseSectionModule } from './course_section/course_section.module';
import { LessonModule } from './lesson/lesson.module';
import { PublicModule } from './public/public.module';
import { AdminModule } from './admin/admin.module';
import { PaymentModule } from './payment/payment.module';
import { OrderModule } from './order/order.module';
import { StudentModule } from './student/student.module';
import { CouponModule } from './admin/coupon/coupon.module';
import { PromotionModule } from './admin/promotion/promotion.module';
import { InstructorEnrollmentModule } from './instructor/enrollment/enrollment.module';
import { AdminEnrollmentModule } from './admin/enrollment/enrollment.module';
import { InstructorModule } from './instructor/instructor.module';
import { AdminOrderModule } from './admin/order/order.module';
import { AdminPaymentModule } from './admin/payment/payment.module';
import { RevenueModule } from './revenue/revenue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    AdminModule,
    RevenueModule,
    AdminEnrollmentModule,
    AdminOrderModule,
    AdminPaymentModule,
    PrismaModule,
    CategoriesModule,
    UsersModule,
    CouponModule,
    PromotionModule,
    ProfileModule,
    CourseGroupModule,
    CourseModule,
    CourseSectionModule,
    LessonModule,
    PublicModule,
    PaymentModule,
    OrderModule,
    StudentModule,
    InstructorEnrollmentModule,
    InstructorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

