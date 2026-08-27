import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LeaveRequestService } from './leave-request.service.js';
import {
  LeaveStatusEnum,
  LeaveTypeEnum,
  AttendanceStatusEnum,
} from '@repo/contracts';

describe('LeaveRequestService', () => {
  let service: LeaveRequestService;
  let mockLeaveRepo: any;
  let mockStaffRepo: any;
  let mockAttendanceRepo: any;
  let mockLogger: any;

  beforeEach(() => {
    mockLeaveRepo = {
      createQueryBuilder: vi.fn(),
      findOne: vi.fn(),
      find: vi.fn(),
      create: vi.fn((dto) => ({ id: 1, uuid: 'leave-1', ...dto })),
      save: vi.fn((entity) =>
        Promise.resolve({
          id: entity.id || 1,
          uuid: entity.uuid || 'leave-1',
          ...entity,
        }),
      ),
      merge: vi.fn((entity, dto) => Object.assign(entity, dto)),
      softDelete: vi.fn().mockResolvedValue({ affected: 1 }),
    };

    mockStaffRepo = {
      findOne: vi.fn(),
    };

    mockAttendanceRepo = {
      findOne: vi.fn(),
      create: vi.fn((dto) => ({ id: 10, ...dto })),
      save: vi.fn((entity) => Promise.resolve(entity)),
    };

    mockLogger = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    };

    service = new LeaveRequestService(
      mockLeaveRepo,
      mockStaffRepo,
      mockAttendanceRepo,
      mockLogger,
    );
  });

  describe('1. Happy Path & Approval Sync', () => {
    it('should create leave request with status PENDING', async () => {
      mockStaffRepo.findOne.mockResolvedValue({ id: 1, name: 'John Sok' });

      const dto = {
        teacherId: 1,
        leaveType: LeaveTypeEnum.CASUAL,
        startDate: '2026-08-20',
        endDate: '2026-08-21',
        totalDays: 2.0,
        reason: 'Personal family matters',
      };

      mockLeaveRepo.findOne.mockResolvedValue({
        id: 1,
        ...dto,
        status: LeaveStatusEnum.PENDING,
        teacher: { name: 'John Sok' },
      });

      const result = await service.create(dto, 101);
      expect(result).toBeDefined();
      expect(mockLeaveRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          teacherId: 1,
          status: LeaveStatusEnum.PENDING,
          userId: 101,
        }),
      );
    });

    it('should approve leave request and auto-sync ON_LEAVE teacher attendances', async () => {
      const leave = {
        id: 1,
        teacherId: 1,
        leaveType: LeaveTypeEnum.CASUAL,
        startDate: '2026-08-20',
        endDate: '2026-08-20',
        reason: 'Personal family matters',
        status: LeaveStatusEnum.PENDING,
      };

      mockLeaveRepo.findOne.mockResolvedValue(leave);
      mockAttendanceRepo.findOne.mockResolvedValue(null);

      const result = await service.review(
        1,
        { status: LeaveStatusEnum.APPROVED, syncAttendance: true },
        99,
      );
      expect(result).toBeDefined();
      expect(mockAttendanceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          teacherId: 1,
          date: '2026-08-20',
          status: AttendanceStatusEnum.ON_LEAVE,
        }),
      );
      expect(mockAttendanceRepo.save).toHaveBeenCalled();
    });

    it('should reject leave request with rejection reason', async () => {
      const leave: any = {
        id: 1,
        teacherId: 1,
        status: LeaveStatusEnum.PENDING,
      };
      mockLeaveRepo.findOne.mockResolvedValue(leave);

      await service.review(
        1,
        { status: LeaveStatusEnum.REJECTED, rejectionReason: 'Short notice' },
        99,
      );
      expect(leave.status).toBe(LeaveStatusEnum.REJECTED);
      expect(leave.rejectionReason).toBe('Short notice');
    });
  });

  describe('2. Validation & Conflicts (400 / 404)', () => {
    it('should throw BadRequestException if end date is earlier than start date', async () => {
      mockStaffRepo.findOne.mockResolvedValue({ id: 1, name: 'John Sok' });

      await expect(
        service.create({
          teacherId: 1,
          leaveType: LeaveTypeEnum.SICK,
          startDate: '2026-08-25',
          endDate: '2026-08-20',
          totalDays: 1,
          reason: 'Invalid dates',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when updating a non-pending leave request', async () => {
      mockLeaveRepo.findOne.mockResolvedValue({
        id: 1,
        status: LeaveStatusEnum.APPROVED,
      });

      await expect(
        service.update(1, { reason: 'Try to edit' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if leave request does not exist', async () => {
      mockLeaveRepo.findOne.mockResolvedValue(null);
      await expect(
        service.review(999, { status: LeaveStatusEnum.APPROVED }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
