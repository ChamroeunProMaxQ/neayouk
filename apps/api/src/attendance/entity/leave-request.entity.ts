import { randomUUID } from 'node:crypto';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { LeaveStatusEnum, LeaveTypeEnum } from '@repo/contracts';
import type { Staff } from '@src/hr/entity/staff.entity.js';
import type { User } from '@src/user/entity/user.entity.js';

@Entity({ name: 'leave_requests' })
export class LeaveRequest {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 36 })
  uuid!: string;

  @Column({ name: 'branch_id', type: 'int', nullable: true })
  branchId!: number | null;

  @Column({ name: 'teacher_id', type: 'int' })
  teacherId!: number;

  @ManyToOne('Staff', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacher_id' })
  declare teacher?: Staff;

  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId!: number | null;

  @ManyToOne('User', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  declare user?: User | null;

  @Column({
    name: 'leave_type',
    type: 'varchar',
    length: 30,
    default: LeaveTypeEnum.CASUAL,
  })
  leaveType!: LeaveTypeEnum;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate!: string;

  @Column({
    name: 'total_days',
    type: 'decimal',
    precision: 4,
    scale: 1,
    default: 1.0,
  })
  totalDays!: number;

  @Column({ type: 'text' })
  reason!: string;

  @Column({
    name: 'attachment_url',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  attachmentUrl!: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: LeaveStatusEnum.PENDING,
  })
  status!: LeaveStatusEnum;

  @Column({ name: 'reviewer_id', type: 'int', nullable: true })
  reviewerId!: number | null;

  @ManyToOne('User', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewer_id' })
  declare reviewer?: User | null;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt!: Date | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;

  @BeforeInsert()
  generateDefaults() {
    if (!this.uuid) {
      this.uuid = randomUUID();
    }
    if (!this.status) {
      this.status = LeaveStatusEnum.PENDING;
    }
    if (!this.leaveType) {
      this.leaveType = LeaveTypeEnum.CASUAL;
    }
    if (this.totalDays === undefined || this.totalDays === null) {
      this.totalDays = 1.0;
    }
  }
}
