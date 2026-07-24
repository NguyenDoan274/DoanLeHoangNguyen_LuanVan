import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InstructorEnrollmentService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(instructorId: string, courseId?: string) {
    const where: any = {
      courses: {
        instructor_id: instructorId,
      },
    };

    if (courseId) {
      where.course_id = courseId;
    }

    const enrollments = await this.prisma.enrollments.findMany({
      where,
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
          },
        },
        courses: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        enrolled_at: 'desc',
      },
    });

    // Calculate progress percentage
    const result = await Promise.all(
      enrollments.map(async (enrollment) => {
        const totalLessons = await this.prisma.lessons.count({
          where: {
            course_sections: {
              course_id: enrollment.course_id,
            },
          },
        });


        return {
          ...enrollment,
          totalLessons:totalLessons,
        };
      }),
    );

    return { data: result };
  }

  async findStudentsByCourse(instructorId: string, courseId: string) {
    // Verify course ownership
    const course = await this.prisma.courses.findUnique({
      where: { id: courseId },
      select: { instructor_id: true, title: true },
    });

    if (!course) {
      throw new NotFoundException('Không tìm thấy khóa học.');
    }

    if (course.instructor_id !== instructorId) {
      throw new ForbiddenException('Bạn không có quyền xem khóa học này.');
    }

    return this.findAll(instructorId, courseId);
  }
}
