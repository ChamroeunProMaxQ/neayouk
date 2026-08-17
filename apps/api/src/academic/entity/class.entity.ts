import { randomUUID } from 'node:crypto';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  ClassEnrollmentStatusEnum,
  SemesterEnum,
  ShiftEnum,
} from '@repo/contracts';
import type { Program } from './program.entity.js';
import type { StudentClass } from '@src/student/entity/student-class.entity.js';
import type { StudentPayment } from '@src/student/entity/student-payment.entity.js';
import type { ClassTimetable } from './class-timetable.entity.js';

@Entity({ name: 'classes' })
export class Class {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 36 })
  uuid!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  code!: string | null;

  @Column({ name: 'grade_level', type: 'varchar', length: 50, nullable: true })
  gradeLevel!: string | null;

  @Column({ name: 'program_id', type: 'int', nullable: true })
  programId!: number | null;

  @ManyToOne('Program', (p: Program) => p.classes, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'program_id' })
  declare program?: Program | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  section!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  room!: string | null;

  @Column({
    type: 'enum',
    enum: ShiftEnum,
    default: ShiftEnum.MORNING,
  })
  shift!: ShiftEnum;

  @Column({ name: 'start_time', type: 'varchar', length: 10, nullable: true, default: '07:30' })
  startTime!: string | null;

  @Column({ name: 'end_time', type: 'varchar', length: 10, nullable: true, default: '11:30' })
  endTime!: string | null;

  @Column({ name: 'start_date', type: 'date', nullable: true })
  startDate!: string | Date | null;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate!: string | Date | null;

  @Column({ name: 'monthly_fee', type: 'decimal', precision: 10, scale: 2, default: 0 })
  monthlyFee!: number;

  @Column({ name: 'teacher_id', type: 'bigint', unsigned: true, nullable: true })
  teacherId!: number | null;

  @Column({ name: 'academic_year', type: 'varchar', length: 20, nullable: true })
  academicYear!: string | null;

  @Column({
    type: 'enum',
    enum: SemesterEnum,
    default: SemesterEnum.SEMESTER_1,
  })
  semester!: SemesterEnum;

  @Column({ type: 'varchar', length: 26, default: 'ACTIVE' })
  status!: string;

  @OneToMany('StudentClass', (sc: StudentClass) => sc.class)
  declare enrollments?: StudentClass[];

  @OneToMany('StudentPayment', (sp: StudentPayment) => sp.class)
  declare payments?: StudentPayment[];

  @OneToMany('ClassTimetable', (ct: ClassTimetable) => ct.class)
  declare timetables?: ClassTimetable[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;

  @BeforeInsert()
  generateUuid() {
    if (!this.uuid) {
      this.uuid = randomUUID();
    }
  }
}
