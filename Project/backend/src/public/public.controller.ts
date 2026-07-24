import { Controller,Get, Query, Param, UseGuards } from '@nestjs/common';
import { PublicService } from './public.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('api')
// @UseGuards(JwtAuthGuard, RolesGuard)
export class PublicController {
    constructor(private readonly publicService:PublicService){}
    
    @Get('categories')
    getCategories(){
        return this.publicService.getCategories();
    }

    @Get('courses')
    getPublishedCourses(@Query('name') name?: string){
        return this.publicService.getPublishedCourses(name);
    }

    @Get('recomended-courses')
    getRecomendedCourses(){
        return this.publicService.getRecomendedCourses();
    }

    @Get('course/:id')
    getCourseById(@Param('id') id: string){
        return this.publicService.getCourseById(id);
    }

    @Get('course-groups')
    getCourseGroups(){
        return this.publicService.getCourseGroups();
    }

    @Get('course-group/:id')
    getCourseGroupById(@Param('id') id: string){
        return this.publicService.getCourseGroupById(id);
    }
}
