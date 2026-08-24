import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SemesterEnum, ClassEnrollmentStatusEnum } from '@repo/contracts';
import type { Class } from '@src/academic/entity/class.entity.js';
import type { Student } from './student.entity.js';

@Entity({ name: 'student_classes' })
export class StudentClass {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'student_id', type: 'int' })
  studentId!: number;

  @Column({ name: 'class_id', type: 'int' })
  classId!: number;

  @ManyToOne('Student', (student: Student) => student.enrollments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_id' })
  declare student: Student;

  @ManyToOne('Class', (cls: Class) => cls.enrollments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  declare class: Class;

  @Column({ name: 'academic_year', type: 'varchar', length: 20 })
  academicYear!: string;

  @Column({
    type: 'enum',
    enum: SemesterEnum,
    default: SemesterEnum.SEMESTER_1,
  })
  semester!: SemesterEnum;

  @Column({ name: 'is_primary', type: 'boolean', default: true })
  isPrimary!: boolean;

  @Column({
    type: 'enum',
    enum: ClassEnrollmentStatusEnum,
    default: ClassEnrollmentStatusEnum.ENROLLED,
  })
  status!: ClassEnrollmentStatusEnum;

  @Column({
    name: 'enrolled_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  enrolledAt!: Date;

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  remarks!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
