import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BranchStatusEnum, UserStatusEnum, UserTypeEnum } from '@repo/contracts';
import { getSkipTake } from '@src/common/helper/pagination.helper.js';
import type { AuthContext } from '@src/common/helper/branch-scoping.helper.js';
import { Role } from '@src/role/entity/role.entity.js';
import { User } from '@src/user/entity/user.entity.js';
import { Branch } from './entity/branch.entity.js';
import { BranchMapper } from './mapper/branch.mapper.js';
import type { CreateBranchWithAdminDto } from './dto/create-branch-with-admin.dto.js';
import type { FindBranchesDto } from './dto/find-branches.dto.js';
import type { UpdateBranchDto } from './dto/update-branch.dto.js';

@Injectable()
export class BranchService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    private readonly dataSource: DataSource,
  ) {}

  async createBranchWithAdmin(dto: CreateBranchWithAdminDto) {
    return await this.dataSource.transaction(async (manager) => {
      const branchRepo = manager.getRepository(Branch);
      const userRepo = manager.getRepository(User);
      const roleRepo = manager.getRepository(Role);

      // Check if branch code already exists
      const existingBranch = await branchRepo.findOne({
        where: { code: dto.code.toUpperCase() },
      });
      if (existingBranch) {
        throw new ConflictException(`Branch code "${dto.code}" already exists`);
      }

      // Check if admin username already exists
      const existingUser = await userRepo.findOne({
        where: { username: dto.adminUsername },
      });
      if (existingUser) {
        throw new ConflictException(`Username "${dto.adminUsername}" is already taken`);
      }

      // Create branch
      const branch = branchRepo.create({
        name: dto.branchName,
        code: dto.code.toUpperCase(),
        address: dto.address || null,
        phone: dto.phone || null,
        email: dto.email || null,
        isDefault: true,
        status: BranchStatusEnum.ACTIVE,
      });
      const savedBranch = await branchRepo.save(branch);

      // Find or create default admin role
      let adminRole = await roleRepo.findOne({
        where: { slug: 'admin' },
      });
      if (!adminRole) {
        adminRole = roleRepo.create({
          name: 'Administrator',
          slug: 'admin',
          description: 'Branch Administrator Role',
        });
        adminRole = await roleRepo.save(adminRole);
      }

      // Create initial branch admin user
      const adminUser = userRepo.create({
        username: dto.adminUsername,
        password: dto.adminPassword,
        userType: UserTypeEnum.ADMIN,
        status: UserStatusEnum.ACTIVE,
        branchId: savedBranch.id,
        roles: [adminRole],
      });
      const savedUser = await userRepo.save(adminUser);

      // Update branch with admin user ID
      savedBranch.adminUserId = savedUser.id;
      await branchRepo.save(savedBranch);

      return {
        branch: BranchMapper.toDto(savedBranch),
        adminUser: {
          id: savedUser.id,
          uuid: savedUser.uuid,
          username: savedUser.username,
          userType: savedUser.userType,
          status: savedUser.status,
          branchId: savedUser.branchId,
        },
      };
    });
  }

  async findAll(dto: FindBranchesDto, currentUser?: AuthContext) {
    const { search, status, sortBy = 'id', sortOrder = 'DESC' } = dto;
    const qb = this.branchRepo.createQueryBuilder('branch');

    if (
      currentUser &&
      currentUser.userType !== UserTypeEnum.SUPER_ADMIN &&
      currentUser.userType !== 'SUPER_ADMIN'
    ) {
      if (currentUser.branchId) {
        qb.andWhere('branch.id = :scopedBranchId', {
          scopedBranchId: currentUser.branchId,
        });
      } else {
        qb.andWhere('1 = 0');
      }
    }

    if (status) {
      qb.andWhere('branch.status = :status', { status });
    }

    if (search) {
      qb.andWhere('(branch.name LIKE :search OR branch.code LIKE :search)', {
        search: `%${search}%`,
      });
    }

    qb.orderBy(`branch.${sortBy}`, sortOrder);

    const { skip, take } = getSkipTake(dto);
    qb.skip(skip).take(take);

    const [rows, count] = await qb.getManyAndCount();
    return [BranchMapper.toDtoList(rows), count];
  }

  async findOne(id: number) {
    const branch = await this.branchRepo.findOne({ where: { id } });
    if (!branch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }
    return BranchMapper.toDto(branch);
  }

  async getCurrentBranch(currentUser?: AuthContext) {
    if (!currentUser?.branchId) {
      throw new NotFoundException('No branch assigned to current user');
    }
    return this.findOne(currentUser.branchId);
  }

  async updateCurrentBranch(currentUser: AuthContext, dto: UpdateBranchDto) {
    if (!currentUser?.branchId) {
      throw new NotFoundException('No branch assigned to current user');
    }
    return this.updateBranch(currentUser.branchId, dto);
  }

  async updateBranch(id: number, dto: UpdateBranchDto) {
    const branch = await this.branchRepo.findOne({ where: { id } });
    if (!branch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }

    if (dto.code && dto.code.toUpperCase() !== branch.code) {
      const existing = await this.branchRepo.findOne({
        where: { code: dto.code.toUpperCase() },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Branch code "${dto.code}" already exists`);
      }
    }

    this.branchRepo.merge(branch, dto);

    if (dto.code) {
      branch.code = dto.code.toUpperCase();
    }
    if (dto.address !== undefined) {
      branch.address = dto.address || null;
    }
    if (dto.phone !== undefined) {
      branch.phone = dto.phone || null;
    }
    if (dto.email !== undefined) {
      branch.email = dto.email || null;
    }

    const saved = await this.branchRepo.save(branch);
    return BranchMapper.toDto(saved);
  }
}
