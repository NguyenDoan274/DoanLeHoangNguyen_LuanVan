import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCourseGroupDto } from './dto/create-course_group.dto';
import { UpdateCourseGroupDto } from './dto/update-course_group.dto';
import { AddCourseToGroupDto } from './dto/add-course-to-group.dto';
import { ReorderCoursesInGroupDto } from './dto/reorder-courses-in-group.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class CourseGroupService {
    constructor (private readonly prisma:PrismaService) {}

    async create(createCourseGroupDto:CreateCourseGroupDto,userId:string)
    {
        const currentUser = await this.prisma.users.findUnique({
            where: { id: userId },
        });
        if (!currentUser) {
            throw new ForbiddenException('Bạn không có quyền tạo nhóm khóa học');
        }
         const category = await this.prisma.categories.findUnique({
            where: {
              id: createCourseGroupDto.category_id,
            },
        });

        if (!category) {
            throw new BadRequestException('Danh mục không tồn tại');
        }
        const course_group= await this.prisma.course_groups.create({
            data: {
                id:randomUUID(),
                title:createCourseGroupDto.title,
                category_id:createCourseGroupDto.category_id,
                description:createCourseGroupDto.description,
                order_index:createCourseGroupDto.order_index,
                owner_id:currentUser.id,
                created_at:new Date(),
                updated_at:new Date(),
                
            }
        })
        return {
            message: "Thêm thành công",
            data: course_group
        };
    }
    async findMyGroups(userId:string) {
        const currentUser = await this.prisma.users.findUnique({
            where: { id: userId },
        });
        if (!currentUser ) {
            throw new ForbiddenException('Bạn không có quyền xem nhóm khóa học');
        }
        const courseGroups = await this.prisma.course_groups.findMany({
            where:{
                owner_id:currentUser.id,
            },
            orderBy: {
                created_at: 'desc',
            },
        });
        if (courseGroups.length == 0) {
            return {
                message: "Không có nhóm khóa học",
                data: [],
            };
        }
        return {
            data: courseGroups
        };

    }
    async findOne(userId:string,id:string) {
        const currentUser = await this.prisma.users.findUnique({
            where: { id: userId },
        });
        if (!currentUser ) {
            throw new ForbiddenException('Bạn không có quyền xem nhóm khóa học');
        }
        const course_group = await this.prisma.course_groups.findUnique({
            where: {
                id:id
            },
            include : {
                course_group_items : {
                    include:{
                        courses:true,
                    },
                    orderBy: { order_index: 'asc' },
                }
            }
        })
        if (!course_group) {
            throw new BadRequestException('Nhóm khóa học không tồn tại');
        }
        if (course_group.owner_id !== currentUser.id) {
            throw new ForbiddenException('Bạn không có quyền xem nhóm khóa học');
        }
        return course_group;
    }

    async findAllCategories () {
        return this.prisma.categories.findMany({
        });
    }

    async update(userId: string, id: string, updateCourseGroupDto: UpdateCourseGroupDto) {
        const currentUser = await this.prisma.users.findUnique({
            where: { id: userId },
        });
        if (!currentUser) {
            throw new ForbiddenException('Bạn không có quyền cập nhật nhóm khóa học');
        }

        const course_group = await this.prisma.course_groups.findUnique({
            where: { id },
        });
        if (!course_group) {
            throw new NotFoundException('Nhóm khóa học không tồn tại');
        }
        if (course_group.owner_id !== currentUser.id) {
            throw new ForbiddenException('Bạn không có quyền cập nhật nhóm khóa học này');
        }

        // Kiểm tra category_id mới nếu có
        if (updateCourseGroupDto.category_id !== undefined) {
            const category = await this.prisma.categories.findUnique({
                where: { id: updateCourseGroupDto.category_id },
            });
            if (!category) {
                throw new BadRequestException('Danh mục không tồn tại');
            }
        }

        const updateData: any = {
            updated_at: new Date(),
        };
        if (updateCourseGroupDto.title !== undefined) updateData.title = updateCourseGroupDto.title;
        if (updateCourseGroupDto.description !== undefined) updateData.description = updateCourseGroupDto.description;
        if (updateCourseGroupDto.category_id !== undefined) updateData.category_id = updateCourseGroupDto.category_id;
        if (updateCourseGroupDto.order_index !== undefined) updateData.order_index = updateCourseGroupDto.order_index;

        const updated = await this.prisma.course_groups.update({
            where: { id },
            data: updateData,
        });

        return {
            message: 'Cập nhật nhóm khóa học thành công',
            data: updated,
        };
    }

    async remove(userId: string, id: string) {
        const currentUser = await this.prisma.users.findUnique({
            where: { id: userId },
        });
        if (!currentUser || currentUser.role !== 'INSTRUCTOR') {
            throw new ForbiddenException('Bạn không có quyền xóa nhóm khóa học');
        }

        const course_group = await this.prisma.course_groups.findUnique({
            where: { id },
        });
        if (!course_group) {
            throw new NotFoundException('Nhóm khóa học không tồn tại');
        }
        if (course_group.owner_id !== currentUser.id) {
            throw new ForbiddenException('Bạn không có quyền xóa nhóm khóa học này');
        }

        // Kiểm tra nếu trong group có chứa courses thì không cho xóa
        const hasItems = await this.prisma.course_group_items.findFirst({
            where: { course_group_id: id },
        });
        if (hasItems) {
            throw new BadRequestException('Không thể xóa nhóm khóa học vì đang chứa khóa học bên trong');
        }

        await this.prisma.course_groups.delete({
            where: { id },
        });

        return {
            message: 'Xóa nhóm khóa học thành công',
        };
    }


        // Helper: kiểm tra group tồn tại và thuộc về user
    private async verifyGroupOwnership(userId: string, groupId: string) {
        const group = await this.prisma.course_groups.findUnique({
            where: { id: groupId },
        });
        if (!group) {
            throw new NotFoundException('Nhóm khóa học không tồn tại');
        }
        if (group.owner_id !== userId) {
            throw new ForbiddenException('Bạn không có quyền thao tác với nhóm khóa học này');
        }
        return group;
    }

    // Thêm khóa học vào nhóm
    async addCourseToGroup(userId: string, groupId: string, dto: AddCourseToGroupDto) {
       const group = await this.verifyGroupOwnership(userId, groupId);

        // Kiểm tra khóa học tồn tại và thuộc về instructor
        const course = await this.prisma.courses.findUnique({
            where: { id: dto.course_id },
        });
        if (!course) {
            throw new NotFoundException('Khóa học không tồn tại');
        }
        if (course.instructor_id !== userId) {
            throw new ForbiddenException('Bạn chỉ có thể thêm khóa học của mình vào nhóm');
        }

        if(group.category_id != course.category_id){
            throw new BadRequestException('Khóa học không cùng danh mục với nhóm');
        }
    
        // Kiểm tra khóa học đã có trong nhóm chưa
        const existing = await this.prisma.course_group_items.findUnique({
            where: {
                course_group_id_course_id: {
                    course_group_id: groupId,
                    course_id: dto.course_id,
                },
            },
        });
        if (existing) {
            throw new BadRequestException('Khóa học đã có trong nhóm này');
        }

        // Tự động tính order_index nếu không truyền
        let orderIndex = dto.order_index;
        if (orderIndex === undefined) {
            const lastItem = await this.prisma.course_group_items.findFirst({
                where: { course_group_id: groupId },
                orderBy: { order_index: 'desc' },
            });
            orderIndex = lastItem ? lastItem.order_index + 1 : 0;
        }

        const item = await this.prisma.course_group_items.create({
            data: {
                course_group_id: groupId,
                course_id: dto.course_id,
                order_index: orderIndex,
                is_required: dto.is_required ?? false,
            },
        });

        return {
            message: 'Thêm khóa học vào nhóm thành công',
            data: item,
        };
    }

    async getCoursesInGroup(userId:string,groupId:string){
        await this.verifyGroupOwnership(userId,groupId)

        const courses = await this.prisma.course_group_items.findMany({
            where: { course_group_id: groupId },
            orderBy: { order_index: 'asc' },
            include: {
                courses: true,
            },
        });
        return {
            message: 'Lấy danh sách khóa học trong nhóm thành công',
            data: courses,
        };
    }

    // Xóa khóa học khỏi nhóm
    async removeCourseFromGroup(userId: string, groupId: string, courseId: string) {
        await this.verifyGroupOwnership(userId, groupId);

        const existing = await this.prisma.course_group_items.findUnique({
            where: {
                course_group_id_course_id: {
                    course_group_id: groupId,
                    course_id: courseId,
                },
            },
        });
        if (!existing) {
            throw new NotFoundException('Khóa học không có trong nhóm này');
        }

        await this.prisma.course_group_items.delete({
            where: {
                course_group_id_course_id: {
                    course_group_id: groupId,
                    course_id: courseId,
                },
            },
        });

        return {
            message: 'Xóa khóa học khỏi nhóm thành công',
        };
    }

    // Sắp xếp thứ tự khóa học trong nhóm
    async reorderCoursesInGroup(userId: string, groupId: string, dto: ReorderCoursesInGroupDto) {
        await this.verifyGroupOwnership(userId, groupId);

        // Cập nhật order_index cho từng item trong transaction
        await this.prisma.$transaction(
            dto.items.map((item) =>
                this.prisma.course_group_items.update({
                    where: {
                        course_group_id_course_id: {
                            course_group_id: groupId,
                            course_id: item.course_id,
                        },
                    },
                    data: {
                        order_index: item.order_index,
                    },
                }),
            ),
        );

        // Trả về danh sách sau khi sắp xếp
        const items = await this.prisma.course_group_items.findMany({
            where: { course_group_id: groupId },
            orderBy: { order_index: 'asc' },
            include: {
                courses: {
                    select: { id: true, title: true, thumbnail_url: true },
                },
            },
        });

        return {
            message: 'Sắp xếp thứ tự khóa học thành công',
            data: items,
        };
    }
}

