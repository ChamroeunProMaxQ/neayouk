import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DefaultActions, UseAbility } from 'nest-casl';
import { UserTypeEnum } from '@repo/contracts';
import { JwtAuthGuard } from '@src/auth/jwt-auth.guard.js';
import { CaslAccessGuard } from '@src/common/guard/casl-access.guard.js';
import { UserTypesGuard } from '@src/common/guard/user-types.guard.js';
import { UserTypes } from '@src/common/decorator/user-type.decorator.js';
import { CurrentUser } from '@src/common/decorator/current-user.decorator.js';
import { ExaminationService } from './examination.service.js';
import { StudentScore } from './entity/student-score.entity.js';
import {
  GetGradebookMatrixDto,
  BatchSaveGradebookDto,
} from './dto/gradebook.dto.js';

@ApiTags('Admin Examinations')
@ApiBearerAuth()
@Controller('admin/examinations')
export class AdminExaminationController {
  constructor(private readonly examinationService: ExaminationService) {}

  @UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
  @UserTypes(UserTypeEnum.CMS, UserTypeEnum.ADMIN, UserTypeEnum.SUPER_ADMIN)
  @UseAbility(DefaultActions.read, StudentScore)
  @Get('matrix')
  async getMatrix(@Query() query: GetGradebookMatrixDto) {
    return this.examinationService.getGradebookMatrix(
      query.classId,
      query.month,
    );
  }

  @UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
  @UserTypes(UserTypeEnum.CMS, UserTypeEnum.ADMIN, UserTypeEnum.SUPER_ADMIN)
  @UseAbility(DefaultActions.create, StudentScore)
  @Post('matrix/save')
  async saveGradebook(
    @Body() dto: BatchSaveGradebookDto,
    @CurrentUser('id') userId?: number,
  ) {
    return this.examinationService.saveGradebook(dto, userId);
  }

  @UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
  @UserTypes(UserTypeEnum.CMS, UserTypeEnum.ADMIN, UserTypeEnum.SUPER_ADMIN)
  @UseAbility(DefaultActions.read, StudentScore)
  @Get('report-card/:studentId')
  async getStudentReportCard(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Query('month') month: string,
    @Query('classId') classId?: number,
  ) {
    return this.examinationService.getStudentReportCard(
      studentId,
      month,
      classId ? Number(classId) : undefined,
    );
  }

  @UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
  @UserTypes(UserTypeEnum.CMS, UserTypeEnum.ADMIN, UserTypeEnum.SUPER_ADMIN)
  @UseAbility(DefaultActions.read, StudentScore)
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="gradebook-export.csv"')
  @Get('matrix/export')
  async exportCsv(@Query() query: GetGradebookMatrixDto) {
    return this.examinationService.exportCsv(query.classId, query.month);
  }
}
