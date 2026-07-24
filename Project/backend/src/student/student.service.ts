import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class StudentService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyCourses(userId: string) {
    const userEnrollments = await this.prisma.enrollments.findMany({
      where: {
        student_id: userId,
        status: 'ACTIVE',
      },
      include: {
        courses: {
          include: {
            categories: true,
            users: {
              select: {
                full_name: true,
              },
            },
          },
        },
      },
    });

    return {
      data: userEnrollments.map((enrollment) => enrollment.courses),
    };
  }
}
