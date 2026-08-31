import {
  Controller,
  Get,
  Header,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DefaultActions, UseAbility } from 'nest-casl';
import { UserTypeEnum, type ReportOverviewDto } from '@repo/contracts';
import { JwtAuthGuard } from '@src/auth/jwt-auth.guard.js';
import { CaslAccessGuard } from '@src/common/guard/casl-access.guard.js';
import { UserTypesGuard } from '@src/common/guard/user-types.guard.js';
import { UserTypes } from '@src/common/decorator/user-type.decorator.js';
import { CurrentUser } from '@src/common/decorator/current-user.decorator.js';
import { InstitutionalReport } from './entity/report.entity.js';
import { FinancialReportService } from './financial-report.service.js';
import { AcademicReportService } from './academic-report.service.js';
import { AttendanceReportService } from './attendance-report.service.js';
import {
  FinancialReportQueryDto,
  AcademicReportQueryDto,
  AttendanceReportQueryDto,
} from './dto/report.dto.js';

@ApiTags('Admin Reports & Analytics')
@ApiBearerAuth()
@Controller('admin/reports')
@UseGuards(JwtAuthGuard, UserTypesGuard, CaslAccessGuard)
@UserTypes(UserTypeEnum.ADMIN, UserTypeEnum.CMS, UserTypeEnum.SUPER_ADMIN)
export class AdminReportController {
  constructor(
    private readonly financialReportService: FinancialReportService,
    private readonly academicReportService: AcademicReportService,
    private readonly attendanceReportService: AttendanceReportService,
  ) { }

  @Get('overview')
  @UseAbility(DefaultActions.read, InstitutionalReport)
  async getOverview(@CurrentUser() currentUser: any): Promise<ReportOverviewDto> {
    const [financial, academic, attendance] = await Promise.all([
      this.financialReportService.getSummary({}, currentUser),
      this.academicReportService.getSummary({}, currentUser),
      this.attendanceReportService.getSummary({ targetType: 'STUDENT' }, currentUser),
    ]);

    return {
      financial: {
        totalRevenue: financial.totalRevenue,
        totalExpenses: financial.totalExpenses + financial.totalPayroll,
        netMargin: financial.netOperatingMargin,
        collectionRate: financial.collectionRate,
      },
      academic: {
        totalStudents: academic.totalStudentsAssessed,
        averageScore: academic.overallAverageScore,
        passRate: academic.passRate,
        honorRollCount: academic.honorRollCount,
      },
      attendance: {
        studentRate: attendance.studentAttendanceRate,
        teacherRate: attendance.teacherAttendanceRate,
        chronicAbsentCount: attendance.chronicAbsenteeismCount,
      },
    };
  }

  @Get('financial/summary')
  @UseAbility(DefaultActions.read, InstitutionalReport)
  async getFinancialSummary(
    @Query() query: FinancialReportQueryDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.financialReportService.getSummary(query, currentUser);
  }

  @Get('financial/export')
  @UseAbility(DefaultActions.read, InstitutionalReport)
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="financial-report.csv"')
  async exportFinancialCsv(
    @Query() query: FinancialReportQueryDto,
    @CurrentUser() currentUser: any,
  ): Promise<string> {
    return this.financialReportService.exportCsv(query, currentUser);
  }

  @Get('academic/summary')
  @UseAbility(DefaultActions.read, InstitutionalReport)
  async getAcademicSummary(
    @Query() query: AcademicReportQueryDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.academicReportService.getSummary(query, currentUser);
  }

  @Get('academic/export')
  @UseAbility(DefaultActions.read, InstitutionalReport)
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="academic-report.csv"')
  async exportAcademicCsv(
    @Query() query: AcademicReportQueryDto,
    @CurrentUser() currentUser: any,
  ): Promise<string> {
    return this.academicReportService.exportCsv(query, currentUser);
  }

  @Get('attendance/summary')
  @UseAbility(DefaultActions.read, InstitutionalReport)
  async getAttendanceSummary(
    @Query() query: AttendanceReportQueryDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.attendanceReportService.getSummary(query, currentUser);
  }

  @Get('attendance/export')
  @UseAbility(DefaultActions.read, InstitutionalReport)
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="attendance-report.csv"')
  async exportAttendanceCsv(
    @Query() query: AttendanceReportQueryDto,
    @CurrentUser() currentUser: any,
  ): Promise<string> {
    return this.attendanceReportService.exportCsv(query, currentUser);
  }
}
