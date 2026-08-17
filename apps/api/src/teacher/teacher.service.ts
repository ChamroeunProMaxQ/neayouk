import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  type LoggerService,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserStatusEnum, UserTypeEnum } from '@repo/contracts';
import { APP_LOGGER } from '@src/common/config/logger.config.js';
import { getSkipTake } from '@src/common/helper/pagination.helper.js';
import { Teacher } from './entity/teacher.entity.js';
import { User } from '@src/user/entity/user.entity.js';
import { Role } from '@src/role/entity/role.entity.js';
import { Class } from '@src/academic/entity/class.entity.js';
import { ClassMapper } from '@src/academic/mapper/class.mapper.js';
import { TeacherMapper } from './mapper/teacher.mapper.js';
import type { CreateTeacherDto } from './dto/create-teacher.dto.js';
import type { UpdateTeacherDto } from './dto/update-teacher.dto.js';
import type { FindTeachersDto } from './dto/find-teachers.dto.js';
import { hashPassword } from '@src/common/helper/password.helper.js';

@Injectable()
export class TeacherService {
  constructor(
    @InjectRepository(Teacher)
    private readonly teacherRepo: Repository<Teacher>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    @InjectRepository(Class)
    private readonly classRepo: Repository<Class>,

    @Inject(APP_LOGGER)
    private readonly logger: LoggerService,
  ) {}

  async findAll({
    search,
    name,
    status,
    gender,
    specialization,
    hasAccount,
    includeDeleted,
    onlyDeleted,
    sortBy = 'id',
    sortOrder = 'DESC',
    ...dto
  }: FindTeachersDto) {
    const query = this.teacherRepo
      .createQueryBuilder('teacher')
      .leftJoinAndSelect('teacher.user', 'user')
      .leftJoinAndSelect('teacher.classes', 'classes')
      .leftJoinAndSelect('classes.enrollments', 'enrollments');

    if (onlyDeleted) {
      query.withDeleted().andWhere('teacher.deleted_at IS NOT NULL');
    } else if (includeDeleted) {
      query.withDeleted();
    }

    if (status) {
      query.andWhere('teacher.status = :status', { status });
    }

    if (gender) {
      query.andWhere('teacher.gender = :gender', { gender });
    }

    if (specialization) {
      query.andWhere('teacher.specialization LIKE :spec', {
        spec: `%${specialization}%`,
      });
    }

    if (hasAccount !== undefined) {
      if (hasAccount) {
        query.andWhere('teacher.user_id IS NOT NULL');
      } else {
        query.andWhere('teacher.user_id IS NULL');
      }
    }

    if (name) {
      query.andWhere('teacher.name LIKE :name', { name: `%${name}%` });
    }

    if (search) {
      query.andWhere(
        '(teacher.name LIKE :search OR teacher.name_km LIKE :search OR teacher.teacher_code LIKE :search OR teacher.phone LIKE :search OR teacher.email LIKE :search OR teacher.specialization LIKE :search)',
        { search: `%${search}%` },
      );
    }

    query.orderBy(`teacher.${sortBy}`, sortOrder);

    const { skip, take } = getSkipTake(dto);
    query.skip(skip).take(take);

    const [entities, total] = await query.getManyAndCount();
    return [TeacherMapper.toDtoList(entities), total] as const;
  }

  async findOne(id: number) {
    const teacher = await this.teacherRepo.findOne({
      where: { id },
      relations: ['user', 'classes', 'classes.enrollments'],
    });

    if (!teacher) {
      throw new NotFoundException('teacher not found');
    }

    return TeacherMapper.toDto(teacher);
  }

  async create(dto: CreateTeacherDto, _userId?: number) {
    if (dto.teacherCode) {
      const existing = await this.teacherRepo.findOne({
        where: { teacherCode: dto.teacherCode },
      });
      if (existing) {
        throw new ConflictException('Teacher code already exists');
      }
    }

    let linkedUserId: number | null = dto.userId ?? null;

    if (linkedUserId) {
      const user = await this.userRepo.findOne({ where: { id: linkedUserId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const existingLink = await this.teacherRepo.findOne({
        where: { userId: linkedUserId },
      });
      if (existingLink) {
        throw new ConflictException(
          'User account is already linked to another teacher',
        );
      }
    } else if (
      dto.createAccount ||
      (dto.username && dto.password)
    ) {
      if (!dto.username || !dto.password) {
        throw new ConflictException(
          'Username and password are required to create a user account',
        );
      }

      const existingUser = await this.userRepo.findOne({
        where: { username: dto.username },
      });
      if (existingUser) {
        throw new ConflictException('Username is already taken');
      }

      let teacherRole = await this.roleRepo.findOne({
        where: { slug: 'teacher' },
      });
      if (!teacherRole) {
        teacherRole = this.roleRepo.create({
          name: 'Teacher',
          slug: 'teacher',
          description: 'Academic teacher role',
        });
        teacherRole = await this.roleRepo.save(teacherRole);
      }

      const newUser = this.userRepo.create({
        username: dto.username,
        password: hashPassword(dto.password),
        userType: UserTypeEnum.CMS,
        status: UserStatusEnum.ACTIVE,
        roles: [teacherRole],
      });
      const savedUser = await this.userRepo.save(newUser);
      linkedUserId = savedUser.id;
    }

    let code = dto.teacherCode;
    if (!code) {
      const count = await this.teacherRepo.count();
      code = `TCH-${String(count + 1).padStart(4, '0')}`;
    }

    const teacher = this.teacherRepo.create({
      teacherCode: code,
      name: dto.name,
      nameKm: dto.nameKm ?? null,
      gender: dto.gender ?? 'MALE',
      dateOfBirth: dto.dateOfBirth ?? null,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
      salaryInHour: dto.salaryInHour ?? 0,
      specialization: dto.specialization ?? null,
      bio: dto.bio ?? null,
      status: dto.status ?? 'ACTIVE',
      userId: linkedUserId,
    });

    const saved = await this.teacherRepo.save(teacher);
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateTeacherDto, _userId?: number) {
    const teacher = await this.teacherRepo.findOne({
      where: { id },
      relations: ['user', 'classes'],
    });

    if (!teacher) {
      throw new NotFoundException('teacher not found');
    }

    if (dto.teacherCode && dto.teacherCode !== teacher.teacherCode) {
      const existing = await this.teacherRepo.findOne({
        where: { teacherCode: dto.teacherCode },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Teacher code already exists');
      }
      teacher.teacherCode = dto.teacherCode;
    }

    if (dto.unbindUser) {
      teacher.userId = null;
      teacher.user = null;
    } else if (dto.userId !== undefined && dto.userId !== teacher.userId) {
      if (dto.userId === null) {
        teacher.userId = null;
        teacher.user = null;
      } else {
        const user = await this.userRepo.findOne({ where: { id: dto.userId } });
        if (!user) {
          throw new NotFoundException('User not found');
        }
        const existingLink = await this.teacherRepo.findOne({
          where: { userId: dto.userId },
        });
        if (existingLink && existingLink.id !== id) {
          throw new ConflictException(
            'User account is already linked to another teacher',
          );
        }
        teacher.userId = dto.userId;
      }
    } else if (
      dto.createAccount ||
      (dto.username && !teacher.userId)
    ) {
      if (!dto.username || !dto.password) {
        throw new ConflictException(
          'Username and password are required to create a user account',
        );
      }
      const existingUser = await this.userRepo.findOne({
        where: { username: dto.username },
      });
      if (existingUser) {
        throw new ConflictException('Username is already taken');
      }

      let teacherRole = await this.roleRepo.findOne({
        where: { slug: 'teacher' },
      });
      if (!teacherRole) {
        teacherRole = this.roleRepo.create({
          name: 'Teacher',
          slug: 'teacher',
          description: 'Academic teacher role',
        });
        teacherRole = await this.roleRepo.save(teacherRole);
      }

      const newUser = this.userRepo.create({
        username: dto.username,
        password: hashPassword(dto.password),
        userType: UserTypeEnum.CMS,
        status: UserStatusEnum.ACTIVE,
        roles: [teacherRole],
      });
      const savedUser = await this.userRepo.save(newUser);
      teacher.userId = savedUser.id;
    } else if (teacher.userId && (dto.username || dto.password)) {
      const user = await this.userRepo.findOne({ where: { id: teacher.userId } });
      if (user) {
        if (dto.username && dto.username !== user.username) {
          const checkUser = await this.userRepo.findOne({
            where: { username: dto.username },
          });
          if (checkUser && checkUser.id !== user.id) {
            throw new ConflictException('Username is already taken');
          }
          user.username = dto.username;
        }
        if (dto.password) {
          user.password = hashPassword(dto.password);
        }
        await this.userRepo.save(user);
      }
    }

    if (dto.name !== undefined) teacher.name = dto.name;
    if (dto.nameKm !== undefined) teacher.nameKm = dto.nameKm;
    if (dto.gender !== undefined) teacher.gender = dto.gender;
    if (dto.dateOfBirth !== undefined) teacher.dateOfBirth = dto.dateOfBirth;
    if (dto.phone !== undefined) teacher.phone = dto.phone;
    if (dto.email !== undefined) teacher.email = dto.email;
    if (dto.salaryInHour !== undefined) teacher.salaryInHour = dto.salaryInHour;
    if (dto.specialization !== undefined) teacher.specialization = dto.specialization;
    if (dto.bio !== undefined) teacher.bio = dto.bio;
    if (dto.status !== undefined) teacher.status = dto.status;

    await this.teacherRepo.save(teacher);
    return this.findOne(id);
  }

  async delete(id: number) {
    const teacher = await this.teacherRepo.findOne({ where: { id } });
    if (!teacher) {
      throw new NotFoundException('teacher not found');
    }

    // Soft delete teacher
    await this.teacherRepo.softDelete(id);
    return { id, success: true };
  }

  async getAssignedClasses(teacherId: number) {
    const teacher = await this.teacherRepo.findOne({ where: { id: teacherId } });
    if (!teacher) {
      throw new NotFoundException('teacher not found');
    }

    const classes = await this.classRepo.find({
      where: { teacherId },
      relations: ['program', 'enrollments'],
      order: { id: 'ASC' },
    });

    return ClassMapper.toDtoList(classes);
  }
}
