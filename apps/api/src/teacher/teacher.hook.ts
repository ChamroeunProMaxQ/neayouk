import {
  Inject,
  Injectable,
  NotFoundException,
  type LoggerService,
} from '@nestjs/common';
import type { SubjectBeforeFilterHook } from 'nest-casl';
import type { Request } from 'express';
import { APP_LOGGER } from '@src/common/config/logger.config.js';
import { TeacherService } from './teacher.service.js';
import type { TeacherAttribute } from '@repo/contracts';

@Injectable()
export class TeacherHook implements SubjectBeforeFilterHook<
  TeacherAttribute,
  Request
> {
  constructor(
    private readonly teacherService: TeacherService,
    @Inject(APP_LOGGER)
    private readonly logger: LoggerService,
  ) {}

  async run({ params }: Request) {
    const id = Number(params.id);
    if (!id || Number.isNaN(id)) {
      return undefined;
    }
    const teacher = await this.teacherService.findOne(id);
    if (!teacher) {
      throw new NotFoundException('teacher not found');
    }
    return teacher;
  }
}
