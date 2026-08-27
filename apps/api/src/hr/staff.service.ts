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
import { hashPassword } from '@src/common/helper/password.helper.js';
import { Staff } from './entity/staff.entity.js';
import { User } from '@src/user/entity/user.entity.js';
import { Role } from '@src/role/entity/role.entity.js';
import { Class } from '@src/academic/entity/class.entity.js';
import { StaffMapper } from './mapper/staff.mapper.js';
import type { CreateStaffDto } from './dto/staff.dto.js';
import type { UpdateStaffDto } from './dto/staff.dto.js';
import type { FindStaffDto } from './dto/staff.dto.js';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff)
    private readonly staffRepo: Repository<Staff>,

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
    department,
    designation,
    salaryType,
    status,
    gender,
    specialization,
    hasAccount,
    includeDeleted,
    onlyDeleted,
    sortBy = 'id',
    sortOrder = 'DESC',
    ...dto
  }: FindStaffDto) {
    const query = this.staffRepo
      .createQueryBuilder('staff')
      .leftJoinAndSelect('staff.user', 'user')
      .leftJoinAndSelect('staff.classes', 'classes')
      .leftJoinAndSelect('classes.enrollments', 'enrollments');

    if (onlyDeleted) {
      query.withDeleted().andWhere('staff.deleted_at IS NOT NULL');
    } else if (includeDeleted) {
      query.withDeleted();
    }

    if (status) {
      query.andWhere('staff.status = :status', { status });
    }

    if (department) {
      query.andWhere('staff.department = :department', { department });
    }

    if (designation) {
      query.andWhere('staff.designation = :designation', { designation });
    }

    if (salaryType) {
      query.andWhere('staff.salary_type = :salaryType', { salaryType });
    }

    if (gender) {
      query.andWhere('staff.gender = :gender', { gender });
    }

    if (specialization) {
      query.andWhere('staff.specialization LIKE :spec', {
        spec: `%${specialization}%`,
      });
    }

    if (hasAccount !== undefined) {
      if (hasAccount) {
        query.andWhere('staff.user_id IS NOT NULL');
      } else {
        query.andWhere('staff.user_id IS NULL');
      }
    }

    if (name) {
      query.andWhere('staff.name LIKE :name', { name: `%${name}%` });
    }

    if (search) {
      query.andWhere(
        '(staff.name LIKE :search OR staff.name_km LIKE :search OR staff.staff_code LIKE :search OR staff.phone LIKE :search OR staff.email LIKE :search OR staff.designation LIKE :search OR staff.specialization LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const sortColumnMap: Record<string, string> = {
      id: 'staff.id',
      name: 'staff.name',
      staffCode: 'staff.staff_code',
      department: 'staff.department',
      designation: 'staff.designation',
      salaryType: 'staff.salary_type',
      baseSalary: 'staff.base_salary',
      hourlyRate: 'staff.hourly_rate',
      status: 'staff.status',
      createdAt: 'staff.created_at',
    };

    const orderCol = sortColumnMap[sortBy] || 'staff.id';
    query.orderBy(orderCol, sortOrder);

    const { skip, take } = getSkipTake(dto);
    query.skip(skip).take(take);

    const [entities, total] = await query.getManyAndCount();
    return [StaffMapper.toDtoList(entities), total] as const;
  }

  async findOne(id: number) {
    const staff = await this.staffRepo.findOne({
      where: { id },
      relations: ['user', 'classes', 'classes.enrollments'],
    });

    if (!staff) {
      throw new NotFoundException('staff not found');
    }

    return StaffMapper.toDto(staff);
  }

  async create(dto: CreateStaffDto, _userId?: number) {
    if (dto.staffCode) {
      const existing = await this.staffRepo.findOne({
        where: { staffCode: dto.staffCode },
      });
      if (existing) {
        throw new ConflictException('Staff code already exists');
      }
    }

    let linkedUserId: number | null = dto.userId ?? null;

    if (linkedUserId) {
      const user = await this.userRepo.findOne({ where: { id: linkedUserId } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      const existingLink = await this.staffRepo.findOne({
        where: { userId: linkedUserId },
      });
      if (existingLink) {
        throw new ConflictException(
          'User account is already linked to another staff member',
        );
      }
    } else if (dto.createAccount || (dto.username && dto.password)) {
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

      const roleSlug =
        dto.department === 'ACADEMIC' || dto.designation?.toLowerCase() === 'teacher'
          ? 'teacher'
          : 'staff';

      let staffRole = await this.roleRepo.findOne({
        where: { slug: roleSlug },
      });
      if (!staffRole) {
        staffRole = this.roleRepo.create({
          name: roleSlug === 'teacher' ? 'Teacher' : 'Staff',
          slug: roleSlug,
          description: `${roleSlug} operational role`,
        });
        staffRole = await this.roleRepo.save(staffRole);
      }

      const newUser = this.userRepo.create({
        username: dto.username,
        password: hashPassword(dto.password),
        userType: UserTypeEnum.CMS,
        status: UserStatusEnum.ACTIVE,
        roles: [staffRole],
      });
      const savedUser = await this.userRepo.save(newUser);
      linkedUserId = savedUser.id;
    }

    let code = dto.staffCode;
    if (!code) {
      const count = await this.staffRepo.count();
      code = `STF-${String(count + 1).padStart(4, '0')}`;
    }

    const staff = this.staffRepo.create({
      staffCode: code,
      name: dto.name,
      nameKm: dto.nameKm ?? null,
      gender: dto.gender ?? 'MALE',
      dateOfBirth: dto.dateOfBirth ?? null,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
      department: dto.department ?? 'ACADEMIC',
      designation: dto.designation ?? 'Teacher',
      specialization: dto.specialization ?? null,
      bio: dto.bio ?? null,
      employmentType: dto.employmentType ?? 'FULL_TIME',
      salaryType: dto.salaryType ?? 'MONTHLY',
      baseSalary: dto.baseSalary ?? 0,
      hourlyRate: dto.hourlyRate ?? 0,
      joiningDate: dto.joiningDate ?? null,
      bankName: dto.bankName ?? null,
      bankAccountName: dto.bankAccountName ?? null,
      bankAccountNumber: dto.bankAccountNumber ?? null,
      status: dto.status ?? 'ACTIVE',
      notes: dto.notes ?? null,
      userId: linkedUserId,
    });

    const saved = await this.staffRepo.save(staff);
    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateStaffDto, _userId?: number) {
    const staff = await this.staffRepo.findOne({
      where: { id },
      relations: ['user', 'classes'],
    });

    if (!staff) {
      throw new NotFoundException('staff not found');
    }

    if (dto.staffCode && dto.staffCode !== staff.staffCode) {
      const existing = await this.staffRepo.findOne({
        where: { staffCode: dto.staffCode },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Staff code already exists');
      }
    }

    if (dto.unbindUser) {
      staff.userId = null;
      staff.user = null;
    } else if (dto.userId !== undefined && dto.userId !== staff.userId) {
      if (dto.userId === null) {
        staff.userId = null;
        staff.user = null;
      } else {
        const user = await this.userRepo.findOne({ where: { id: dto.userId } });
        if (!user) {
          throw new NotFoundException('User not found');
        }
        const existingLink = await this.staffRepo.findOne({
          where: { userId: dto.userId },
        });
        if (existingLink && existingLink.id !== id) {
          throw new ConflictException(
            'User account is already linked to another staff member',
          );
        }
        staff.userId = dto.userId;
      }
    } else if (dto.createAccount || (dto.username && dto.password)) {
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

      const roleSlug =
        (dto.department || staff.department) === 'ACADEMIC' ||
        (dto.designation || staff.designation)?.toLowerCase() === 'teacher'
          ? 'teacher'
          : 'staff';

      let staffRole = await this.roleRepo.findOne({
        where: { slug: roleSlug },
      });
      if (!staffRole) {
        staffRole = this.roleRepo.create({
          name: roleSlug === 'teacher' ? 'Teacher' : 'Staff',
          slug: roleSlug,
          description: `${roleSlug} operational role`,
        });
        staffRole = await this.roleRepo.save(staffRole);
      }

      const newUser = this.userRepo.create({
        username: dto.username,
        password: hashPassword(dto.password),
        userType: UserTypeEnum.CMS,
        status: UserStatusEnum.ACTIVE,
        roles: [staffRole],
      });
      const savedUser = await this.userRepo.save(newUser);
      staff.userId = savedUser.id;
    }

    const {
      createAccount: _ca,
      username: _u,
      password: _p,
      unbindUser: _ub,
      userId: _uid,
      ...cleanDto
    } = dto;

    this.staffRepo.merge(staff, cleanDto);
    await this.staffRepo.save(staff);

    return this.findOne(id);
  }

  async remove(id: number, _userId?: number) {
    const staff = await this.staffRepo.findOne({ where: { id } });
    if (!staff) {
      throw new NotFoundException('staff not found');
    }

    await this.staffRepo.softDelete(id);
    return StaffMapper.toDto(staff);
  }
}
