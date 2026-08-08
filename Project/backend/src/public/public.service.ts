import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { LessonService } from 'src/lesson/lesson.service';

@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lessonService: LessonService,
  ) {}

  async getCategories() {
    const categories = await this.prisma.categories.findMany({
      include: {
        parent: {
          select: { id: true, name: true },
        },
        children: {
          select: { id: true, name: true, description: true },
        },
      },
      orderBy: { name: 'asc' },
    });
    return {
      data: categories,
    }
  }

  async getAppliedPromotion(courseId: string, categoryId: string) {
    const now = new Date();
    const promotions = await this.prisma.promotions.findMany({
      where: {
        is_active: true,
        start_date: { lte: now },
        end_date: { gte: now },
        OR: [
          {
            promotion_courses: {
              some: { course_id: courseId }
            }
          },
          {
            promotion_categories: {
              some: { category_id: categoryId }
            }
          }
        ]
      }
    });

    if (promotions.length === 0) return 0;
    return Math.max(...promotions.map(p => Number(p.discount_percentage)));
  }

  async getPublishedCourses(name?: string, categoryId?: string) {
    let categoryIds: string[] = [];

    if (categoryId) {
      const subCategories = await this.prisma.categories.findMany({
        where: { parent_id: categoryId },
        select: { id: true },
      });
      categoryIds = [categoryId, ...subCategories.map((sc) => sc.id)];
    }

    const courses = await this.prisma.courses.findMany({
      where: {
        status: 'PUBLISHED',
        ...(name && {
          title: {
            contains: name,
            mode: 'insensitive',
          },
        }),
        ...(categoryIds.length > 0 && {
          category_id: { in: categoryIds },
        }),
      },
      include: {
        categories: {
          include: {
            parent: {
              select: { id: true, name: true },
            },
          },
        },
        users: {
          select: {
            full_name: true,
          },
        },
      },
    });

    const coursesWithPromo = await Promise.all(courses.map(async (course) => {
      const discountPercentage = await this.getAppliedPromotion(course.id, course.category_id);
      const originalPrice = Number(course.price);
      const discountedPrice = originalPrice * (1 - discountPercentage / 100);
      return {
        ...course,
        discount_percentage: discountPercentage,
        discounted_price: discountedPrice
      };
    }));

    return {
      data: coursesWithPromo,
    }
  }

  async getRecomendedCourses(){
    const courses = await this.prisma.courses.findMany({
      where: {
        status: 'PUBLISHED',
        is_recommend: true,
      },
      include: {
        categories: true,
        users: {
          select: {
            full_name: true,
          },
        },
      },
    });

    const coursesWithPromo = await Promise.all(courses.map(async (course) => {
      const discountPercentage = await this.getAppliedPromotion(course.id, course.category_id);
      const originalPrice = Number(course.price);
      const discountedPrice = originalPrice * (1 - discountPercentage / 100);
      return {
        ...course,
        discount_percentage: discountPercentage,
        discounted_price: discountedPrice
      };
    }));

    return {
      data: coursesWithPromo,
    }
  }

  async getCourseById(id:string){
    const course = await this.prisma.courses.findUnique({
      where: {
        id:id,
        status: 'PUBLISHED',
      },
      include: {
        categories: true,
        users: {
          select: {
            full_name: true,
            avatar_url: true,
          },
        },
        course_sections: {
          orderBy: { order_index: 'asc' },
          include: {
            lessons: {
              orderBy: { order_index: 'asc' },
            },
          },
        },
      },
    });

    if (!course) {
      return { data: null };
    }

    // Sync Mux status for processing lessons in parallel
    if (course.course_sections) {
        for (const section of course.course_sections) {
            if (section.lessons) {
                const synced = await Promise.all(
                    section.lessons.map(async (lesson) => {
                        if (lesson.mux_status === 'PROCESSING') {
                            return await this.lessonService.syncLessonMuxStatus(lesson.id);
                        }
                        return lesson;
                    })
                );
                section.lessons = synced.filter((l): l is typeof section.lessons[number] => l !== null);
            }
        }
    }

    const discountPercentage = await this.getAppliedPromotion(course.id, course.category_id);
    const originalPrice = Number(course.price);
    const discountedPrice = originalPrice * (1 - discountPercentage / 100);

    return {
      data: {
        ...course,
        discount_percentage: discountPercentage,
        discounted_price: discountedPrice
      },
    }
  }

   async getCourseGroups() {
    const courseGroups = await this.prisma.course_groups.findMany({
      include: {
        course_group_items: {
          orderBy: { order_index: 'asc' },
          include: {
            courses: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });
    return {
      data: courseGroups,
    }
  }

  async getCourseGroupById(id: string) {
    const courseGroup = await this.prisma.course_groups.findUnique({
      where: { id: id },
      include: {
        categories: true,
        course_group_items: {
          orderBy: { order_index: 'asc' },
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
        },
      },
    });

    if (!courseGroup) {
      return { data: null };
    }

    const itemsWithPromo = await Promise.all(
      courseGroup.course_group_items.map(async (item) => {
        if (!item.courses) return item;
        const discountPercentage = await this.getAppliedPromotion(item.courses.id, item.courses.category_id);
        const originalPrice = Number(item.courses.price);
        const discountedPrice = originalPrice * (1 - discountPercentage / 100);
        return {
          ...item,
          courses: {
            ...item.courses,
            discount_percentage: discountPercentage,
            discounted_price: discountedPrice,
          },
        };
      })
    );

    return {
      data: {
        ...courseGroup,
        course_group_items: itemsWithPromo,
      },
    };
  }
}
