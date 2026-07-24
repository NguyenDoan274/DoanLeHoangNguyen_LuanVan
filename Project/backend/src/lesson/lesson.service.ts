import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import Mux from '@mux/mux-node';
import { PrismaService } from 'src/prisma/prisma.service';
import { randomUUID } from 'crypto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';


@Injectable()
export class LessonService {
    constructor(private readonly prisma: PrismaService){}
    private readonly muxClient = new Mux({
            tokenId: process.env.MUX_TOKEN_ID,
            tokenSecret: process.env.MUX_TOKEN_SECRET,
        });
    

     private async verifySectionOwnership(userId: string, courseId: string, sectionId: string) {
        const course = await this.prisma.courses.findUnique({
            where: { id: courseId },
        });
        if (!course) {
            throw new NotFoundException('Khóa học không tồn tại');
        }
        if (course.instructor_id !== userId) {
            throw new ForbiddenException('Bạn không có quyền thao tác trên khóa học này');
        }
        const section = await this.prisma.course_sections.findUnique({
            where: { id: sectionId },
        });
        if (!section) {
            throw new NotFoundException('Chương học không tồn tại');
        }
        if (section.course_id !== courseId) {
            throw new BadRequestException('Chương học không thuộc khóa học này');
        }
        return section;
    }

    async syncLessonMuxStatus(lessonId: string) {
        let lesson = await this.prisma.lessons.findUnique({ where: { id: lessonId } });
        if (!lesson || lesson.mux_status === 'READY' || lesson.mux_status === 'ERRORED') {
            return lesson;
        }

        try {
            let assetId = lesson.mux_asset_id;

            if (!assetId && lesson.mux_upload_id) {
                const upload = await this.muxClient.video.uploads.retrieve(lesson.mux_upload_id);
                if (upload.status === 'asset_created' && upload.asset_id) {
                    assetId = upload.asset_id;
                    lesson = await this.prisma.lessons.update({
                        where: { id: lessonId },
                        data: {
                            mux_asset_id: assetId,
                        },
                    });
                } else if (upload.status === 'timed_out' || upload.status === 'cancelled') {
                    return await this.prisma.lessons.update({
                        where: { id: lessonId },
                        data: {
                            mux_status: 'ERRORED',
                        },
                    });
                }
            }

            if (assetId) {
                const asset = await this.muxClient.video.assets.retrieve(assetId);
                if (asset.status === 'ready') {
                    const playbackId = asset.playback_ids?.[0]?.id;
                    const duration = asset.duration ? Math.round(asset.duration) : null;
                    return await this.prisma.lessons.update({
                        where: { id: lessonId },
                        data: {
                            mux_playback_id: playbackId,
                            mux_status: 'READY',
                            duration_sec: duration,
                        },
                    });
                } else if (asset.status === 'errored') {
                    return await this.prisma.lessons.update({
                        where: { id: lessonId },
                        data: {
                            mux_status: 'ERRORED',
                        },
                    });
                }
            }
        } catch (err) {
            console.error('Error syncing Mux status:', err);
        }
        return lesson;
    }

    async createLesson(userId: string, courseId: string, sectionId: string, dto: CreateLessonDto, video?: Express.Multer.File) {
        await this.verifySectionOwnership(userId, courseId, sectionId);

        let orderIndex: number;
        if (dto.order_index !== undefined && dto.order_index !== '') {
            orderIndex = parseInt(dto.order_index, 10) || 0;

            const existingLessonIndex = await this.prisma.lessons.findFirst({
                where: {
                    section_id: sectionId,
                    order_index: orderIndex
                }
            });

            if (existingLessonIndex) {
                throw new BadRequestException(`Thứ tự học ${orderIndex} đã tồn tại trong chương này!`);
            }

        } else {
            const lastLesson = await this.prisma.lessons.findFirst({
                where: { section_id: sectionId },
                orderBy: { order_index: 'desc' },
            });
            orderIndex = lastLesson ? lastLesson.order_index + 1 : 0;
        }

        const isPreview = dto.is_preview === 'true' || dto.is_preview === true;
        const lessonId = randomUUID();

        let muxUploadId: string | null = null;
        let muxStatus: any = 'NO_VIDEO';

        if (video) {
            try {
                // 1. Create Direct Upload in Mux
                const upload = await this.muxClient.video.uploads.create({
                    new_asset_settings: {
                        playback_policy: ['public'],
                    },
                    cors_origin: '*',
                });

                muxUploadId = upload.id;
                muxStatus = 'PROCESSING';

                if (!upload.url) {
                    throw new BadRequestException('Mux không trả về url upload');
                }

                // 2. PUT file buffer to Mux Upload URL
                const response = await fetch(upload.url, {
                    method: 'PUT',
                    body: video.buffer as any,
                    headers: {
                        'Content-Type': video.mimetype,
                    },
                });

                if (!response.ok) {
                    throw new BadRequestException('Không thể tải video lên Mux');
                }
            } catch (err) {
                throw new BadRequestException('Lỗi khi thiết lập video trên Mux: ' + err.message);
            }
        }

        const lesson = await this.prisma.lessons.create({
            data: {
                id: lessonId,
                section_id: sectionId,
                title: dto.title,
                content: dto.content || null,
                order_index: orderIndex,
                is_preview: isPreview,
                mux_upload_id: muxUploadId,
                mux_status: muxStatus,
                created_at: new Date(),
                updated_at: new Date(),
            },
        });

        if (video && lessonId) {
            this.syncLessonMuxStatus(lessonId).catch(console.error);
        }

        return {
            message: 'Thêm bài học thành công',
            data: lesson,
        };
    }

    async findLessons(userId: string, courseId: string, sectionId: string) {
        await this.verifySectionOwnership(userId, courseId, sectionId);

        const lessons = await this.prisma.lessons.findMany({
            where: { section_id: sectionId },
            orderBy: { order_index: 'asc' },
        });

        // Sync Mux status for processing lessons in parallel background
        const syncedLessons = await Promise.all(
            lessons.map(async (lesson) => {
                if (lesson.mux_status === 'PROCESSING') {
                    return await this.syncLessonMuxStatus(lesson.id);
                }
                return lesson;
            })
        );

        return {
            data: syncedLessons,
        };
    }

    async findLessonDetail(userId: string, courseId: string, sectionId: string, lessonId: string) {
        await this.verifySectionOwnership(userId, courseId, sectionId);

        const lesson = await this.prisma.lessons.findUnique({
            where: { id: lessonId },
        });

        if (!lesson) {
            throw new NotFoundException('Bài học không tồn tại');
        }

        if (lesson.section_id !== sectionId) {
            throw new BadRequestException('Bài học không thuộc chương học này');
        }

        const syncedLesson = await this.syncLessonMuxStatus(lesson.id);

        return {
            data: syncedLesson,
        };
    }

    async updateLesson(userId: string, courseId: string, sectionId: string, lessonId: string, dto: UpdateLessonDto, video?: Express.Multer.File) {
        await this.verifySectionOwnership(userId, courseId, sectionId);

        const lesson = await this.prisma.lessons.findUnique({
            where: { id: lessonId },
        });

        if (!lesson) {
            throw new NotFoundException('Bài học không tồn tại');
        }

        if (lesson.section_id !== sectionId) {
            throw new BadRequestException('Bài học không thuộc chương học này');
        }

        const updateData: any = {
            updated_at: new Date(),
        };

        if (dto.title !== undefined) updateData.title = dto.title;
        if (dto.content !== undefined) updateData.content = dto.content;
        if (dto.order_index !== undefined && dto.order_index !== '') {
            updateData.order_index = parseInt(dto.order_index, 10) || 0;
        }
        if (dto.is_preview !== undefined) {
            updateData.is_preview = dto.is_preview === 'true' || dto.is_preview === true;
        }

        if (video) {
            // Delete old Mux asset if exists
            if (lesson.mux_asset_id) {
                try {
                    await this.muxClient.video.assets.delete(lesson.mux_asset_id);
                } catch (err) {
                    console.error('Error deleting old Mux asset:', err);
                }
            }

            try {
                // Create new upload link
                const upload = await this.muxClient.video.uploads.create({
                    new_asset_settings: {
                        playback_policy: ['public'],
                    },
                    cors_origin: '*',
                });

                updateData.mux_upload_id = upload.id;
                updateData.mux_status = 'PROCESSING';
                updateData.mux_asset_id = null;
                updateData.mux_playback_id = null;
                updateData.duration_sec = null;

                if (!upload.url) {
                    throw new BadRequestException('Mux không trả về url upload');
                }

                // PUT to Mux
                const response = await fetch(upload.url, {
                    method: 'PUT',
                    body: video.buffer as any,
                    headers: {
                        'Content-Type': video.mimetype,
                    },
                });

                if (!response.ok) {
                    throw new BadRequestException('Không thể tải video mới lên Mux');
                }
            } catch (err) {
                throw new BadRequestException('Lỗi khi cập nhật video trên Mux: ' + err.message);
            }
        }

        const updated = await this.prisma.lessons.update({
            where: { id: lessonId },
            data: updateData,
        });

        if (video) {
            this.syncLessonMuxStatus(updated.id).catch(console.error);
        }

        return {
            message: 'Cập nhật bài học thành công',
            data: updated,
        };
    }

    async removeLesson(userId: string, courseId: string, sectionId: string, lessonId: string) {
        await this.verifySectionOwnership(userId, courseId, sectionId);

        const lesson = await this.prisma.lessons.findUnique({
            where: { id: lessonId },
        });

        if (!lesson) {
            throw new NotFoundException('Bài học không tồn tại');
        }

        if (lesson.section_id !== sectionId) {
            throw new BadRequestException('Bài học không thuộc chương học này');
        }

        if (lesson.mux_asset_id) {
            try {
                await this.muxClient.video.assets.delete(lesson.mux_asset_id);
            } catch (err) {
                console.error('Error deleting Mux asset:', err);
            }
        }

        await this.prisma.lessons.delete({
            where: { id: lessonId },
        });

        return {
            message: 'Xóa bài học thành công',
        };
    }

}
