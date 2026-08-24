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
import { StudentStatusEnum, ClassEnrollmentStatusEnum } from '@repo/contracts';
import type { StudentClass } from './student-class.entity.js';
import type { StudentPayment } from './student-payment.entity.js';

@Entity({ name: 'students' })
export class Student {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 36 })
  uuid!: string;

  @Column({
    name: 'student_code',
    type: 'varchar',
    length: 50,
    unique: true,
    nullable: true,
  })
  studentCode!: string | null;

  @Column({ name: 'first_name', type: 'varchar', length: 255 })
  firstName!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 255 })
  lastName!: string;

  @Column({
    name: 'first_name_km',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  firstNameKm!: string | null;

  @Column({
    name: 'last_name_km',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  lastNameKm!: string | null;

  @Column({ type: 'varchar', length: 16, default: 'MALE' })
  gender!: 'MALE' | 'FEMALE' | 'OTHER';

  @Column({
    name: 'date_of_birth',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  dateOfBirth!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contact!: string | null;

  @Column({
    name: 'guardian_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  guardianName!: string | null;

  @Column({
    name: 'guardian_phone',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  guardianPhone!: string | null;

  @Column({ name: 'payable_date', type: 'int', default: 1, nullable: true })
  payableDate!: number;

  @Column({
    name: 'registered_at',
    type: 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  registeredAt!: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount!: number;

  @Column({
    type: 'enum',
    enum: StudentStatusEnum,
    default: StudentStatusEnum.ACTIVE,
  })
  status!: StudentStatusEnum;

  @OneToMany('StudentClass', (sc: StudentClass) => sc.student)
  declare enrollments?: StudentClass[];

  @OneToMany('StudentPayment', (sp: StudentPayment) => sp.student)
  declare payments?: StudentPayment[];

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
      this.status = StudentStatusEnum.ACTIVE;
    }
    if (!this.payableDate) {
      this.payableDate = 1;
    }
    if (!this.registeredAt) {
      this.registeredAt = new Date();
    }
  }
}
