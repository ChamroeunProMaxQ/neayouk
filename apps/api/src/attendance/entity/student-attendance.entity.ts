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
import type { Student } from '@src/student/entity/student.entity.js';
import type { Class } from '@src/academic/entity/class.entity.js';
import type { ClassTimetable } from '@src/academic/entity/class-timetable.entity.js';
import type { User } from '@src/user/entity/user.entity.js';

@Entity({ name: 'student_attendances' })
export class StudentAttendance {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 36 })
  uuid!: string;

  @Column({ name: 'student_id', type: 'int' })
  studentId!: number;

  @ManyToOne('Student', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  declare student?: Student;

  @Column({ name: 'class_id', type: 'int' })
  classId!: number;

  @ManyToOne('Class', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  declare class?: Class;

  @Column({ type: 'date' })
  date!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: AttendanceStatusEnum.PRESENT,
  })
  status!: AttendanceStatusEnum;

  @Column({ name: 'session_slot_id', type: 'int', nullable: true })
  sessionSlotId!: number | null;

  @ManyToOne('ClassTimetable', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'session_slot_id' })
  declare sessionSlot?: ClassTimetable | null;

  @Column({ type: 'text', nullable: true })
  remarks!: string | null;

  @Column({ name: 'recorded_by', type: 'int', nullable: true })
  recordedBy!: number | null;

  @ManyToOne('User', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'recorded_by' })
  declare recorder?: User | null;

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
  }
}
