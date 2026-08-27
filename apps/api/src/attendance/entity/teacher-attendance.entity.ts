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
import { AttendanceStatusEnum } from '@repo/contracts';
import type { Staff } from '@src/hr/entity/staff.entity.js';
import type { User } from '@src/user/entity/user.entity.js';

@Entity({ name: 'teacher_attendances' })
export class TeacherAttendance {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 36 })
  uuid!: string;

  @Column({ name: 'teacher_id', type: 'int' })
  teacherId!: number;

  @ManyToOne('Staff', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacher_id' })
  declare teacher?: Staff;

  @Column({ type: 'date' })
  date!: string;

  @Column({
    name: 'check_in_time',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  checkInTime!: string | null;

  @Column({
    name: 'check_out_time',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  checkOutTime!: string | null;

  @Column({
    name: 'hours_worked',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  hoursWorked!: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: AttendanceStatusEnum.PRESENT,
  })
  status!: AttendanceStatusEnum;

  @Column({ type: 'text', nullable: true })
  remarks!: string | null;

  @Column({ name: 'verified_by', type: 'int', nullable: true })
  verifiedBy!: number | null;

  @ManyToOne('User', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'verified_by' })
  declare verifier?: User | null;

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
      this.status = AttendanceStatusEnum.PRESENT;
    }
    if (this.hoursWorked === undefined || this.hoursWorked === null) {
      this.hoursWorked = 0;
    }
  }
}
