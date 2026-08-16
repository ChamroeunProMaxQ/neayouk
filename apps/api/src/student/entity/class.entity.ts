import { randomUUID } from 'node:crypto';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  SemesterEnum,
  ClassEnrollmentStatusEnum,
  type ClassAttribute,
} from '@repo/contracts';
import type { StudentClass } from './student-class.entity.js';
import type { StudentPayment } from './student-payment.entity.js';
@Entity({ name: 'classes' })
export class Class implements ClassAttribute {
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

  @Column({ type: 'varchar', length: 255, nullable: true })
  program!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  section!: string | null;

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

  @Column({ type: 'int', default: 30 })
  capacity!: number;

  @Column({ type: 'varchar', length: 26, default: 'ACTIVE' })
  status!: string;

  @OneToMany('StudentClass', (sc: StudentClass) => sc.class)
  declare enrollments?: StudentClass[];

  @OneToMany('StudentPayment', (sp: StudentPayment) => sp.class)
  declare payments?: StudentPayment[];

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

  toJSON() {
    return {
      id: this.id,
      uuid: this.uuid,
      name: this.name,
      code: this.code,
      gradeLevel: this.gradeLevel,
      program: this.program,
      section: this.section,
      monthlyFee: Number(this.monthlyFee),
      teacherId: this.teacherId ? Number(this.teacherId) : null,
      academicYear: this.academicYear,
      semester: this.semester,
      capacity: this.capacity,
      status: this.status,
      studentCount: this.enrollments ? this.enrollments.filter((e) => e.status === ClassEnrollmentStatusEnum.ENROLLED).length : undefined,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}
