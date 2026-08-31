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
import type { Student } from '@src/student/entity/student.entity.js';
import type { Class } from '@src/academic/entity/class.entity.js';
import type { User } from '@src/user/entity/user.entity.js';

@Entity({ name: 'student_scores' })
export class StudentScore {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 36 })
  uuid!: string;

  @Column({ name: 'branch_id', type: 'int', nullable: true })
  branchId!: number | null;

  @Column({ name: 'student_id', type: 'int' })
  studentId!: number;

  @ManyToOne('Student', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student?: Student;

  @Column({ name: 'class_id', type: 'int' })
  classId!: number;

  @ManyToOne('Class', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  class?: Class;

  @Column({ type: 'varchar', length: 7 })
  month!: string;

  @Column({ name: 'academic_year', type: 'varchar', length: 20, default: '2025-2026' })
  academicYear!: string;

  @Column({ type: 'varchar', length: 26, default: 'SEMESTER_1' })
  semester!: string;

  @Column({ type: 'json', default: {} })
  scores!: Record<string, number>;

  @Column({
    name: 'total_raw_score',
    type: 'numeric',
    precision: 6,
    scale: 2,
    default: 0.0,
    transformer: {
      to: (v: number) => v,
      from: (v: string | number) => Number(v),
    },
  })
  totalRawScore!: number;

  @Column({
    name: 'total_weighted_score',
    type: 'numeric',
    precision: 6,
    scale: 2,
    default: 0.0,
    transformer: {
      to: (v: number) => v,
      from: (v: string | number) => Number(v),
    },
  })
  totalWeightedScore!: number;

  @Column({
    type: 'numeric',
    precision: 5,
    scale: 2,
    default: 0.0,
    transformer: {
      to: (v: number) => v,
      from: (v: string | number) => Number(v),
    },
  })
  percentage!: number;

  @Column({ name: 'grade_letter', type: 'varchar', length: 5, default: 'F' })
  gradeLetter!: string;

  @Column({ type: 'int', nullable: true })
  rank!: number | null;

  @Column({ type: 'text', nullable: true })
  feedback!: string | null;

  @Column({ name: 'recorded_by', type: 'int', nullable: true })
  recordedBy!: number | null;

  @ManyToOne('User', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'recorded_by' })
  recorder?: User | null;

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
