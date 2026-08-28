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
@UserTypes(UserTypeEnum.ADMIN, UserTypeEnum.CMS)
export class AdminReportController {
  constructor(
    private readonly financialReportService: FinancialReportService,
    private readonly academicReportService: AcademicReportService,
    private readonly attendanceReportService: AttendanceReportService,
  ) { }

  @Get('overview')
  @UseAbility(DefaultActions.read, InstitutionalReport)
  async getOverview(): Promise<ReportOverviewDto> {
    const [financial, academic, attendance] = await Promise.all([
      this.financialReportService.getSummary({}),
      this.academicReportService.getSummary({}),
      this.attendanceReportService.getSummary({ targetType: 'STUDENT' }),
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
  async getFinancialSummary(@Query() query: FinancialReportQueryDto) {
    return this.financialReportService.getSummary(query);
  }

  @Get('financial/export')
  @UseAbility(DefaultActions.read, InstitutionalReport)
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="financial-report.csv"')
  async exportFinancialCsv(@Query() query: FinancialReportQueryDto): Promise<string> {
    return this.financialReportService.exportCsv(query);
  }

  @Get('academic/summary')
  @UseAbility(DefaultActions.read, InstitutionalReport)
  async getAcademicSummary(@Query() query: AcademicReportQueryDto) {
    return this.academicReportService.getSummary(query);
  }

  @Get('academic/export')
  @UseAbility(DefaultActions.read, InstitutionalReport)
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="academic-report.csv"')
  async exportAcademicCsv(@Query() query: AcademicReportQueryDto): Promise<string> {
    return this.academicReportService.exportCsv(query);
  }

  @Get('attendance/summary')
  @UseAbility(DefaultActions.read, InstitutionalReport)
  async getAttendanceSummary(@Query() query: AttendanceReportQueryDto) {
    return this.attendanceReportService.getSummary(query);
  }

  @Get('attendance/export')
  @UseAbility(DefaultActions.read, InstitutionalReport)
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="attendance-report.csv"')
  async exportAttendanceCsv(@Query() query: AttendanceReportQueryDto): Promise<string> {
    return this.attendanceReportService.exportCsv(query);
  }
}
