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
import { Branch } from '@src/branch/entity/branch.entity.js';
import type { User } from '@src/user/entity/user.entity.js';
import type { Class } from '@src/academic/entity/class.entity.js';
import type { Payroll } from './payroll.entity.js';
import type { TeacherAttendance } from '@src/attendance/entity/teacher-attendance.entity.js';
import type { LeaveRequest } from '@src/attendance/entity/leave-request.entity.js';

@Entity({ name: 'staff' })
export class Staff {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 36 })
  uuid!: string;

  @Column({ name: 'branch_id', type: 'int', nullable: true })
  branchId!: number | null;

  @ManyToOne(() => Branch, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'branch_id' })
  branch?: Branch | null;

  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId!: number | null;

  @ManyToOne('User', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  declare user?: User | null;

  @Column({
    name: 'staff_code',
    type: 'varchar',
    length: 50,
    unique: true,
    nullable: true,
  })
  staffCode!: string | null;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'name_km', type: 'varchar', length: 255, nullable: true })
  nameKm!: string | null;

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
  phone!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 50, default: 'ACADEMIC' })
  department!: string;

  @Column({ type: 'varchar', length: 100, default: 'Teacher' })
  designation!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  specialization!: string | null;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @Column({
    name: 'employment_type',
    type: 'varchar',
    length: 50,
    default: 'FULL_TIME',
  })
  employmentType!: string;

  @Column({
    name: 'salary_type',
    type: 'varchar',
    length: 20,
    default: 'MONTHLY',
  })
  salaryType!: 'MONTHLY' | 'HOURLY';

  @Column({
    name: 'base_salary',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  baseSalary!: number;

  @Column({
    name: 'hourly_rate',
    type: 'decimal',
    precision: 8,
    scale: 2,
    default: 0.0,
  })
  hourlyRate!: number;

  @Column({
    name: 'joining_date',
    type: 'date',
    nullable: true,
  })
  joiningDate!: string | null;

  @Column({ name: 'bank_name', type: 'varchar', length: 100, nullable: true })
  bankName!: string | null;

  @Column({
    name: 'bank_account_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  bankAccountName!: string | null;

  @Column({
    name: 'bank_account_number',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  bankAccountNumber!: string | null;

  @Column({ type: 'varchar', length: 26, default: 'ACTIVE' })
  status!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @OneToMany('Class', (c: Class) => c.teacher)
  declare classes?: Class[];

  @OneToMany('TeacherAttendance', (a: TeacherAttendance) => a.teacher)
  declare attendances?: TeacherAttendance[];

  @OneToMany('LeaveRequest', (l: LeaveRequest) => l.teacher)
  declare leaveRequests?: LeaveRequest[];

  @OneToMany('Payroll', (p: Payroll) => p.staff)
  declare payrolls?: Payroll[];

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
      this.status = 'ACTIVE';
    }
    if (!this.gender) {
      this.gender = 'MALE';
    }
    if (!this.department) {
      this.department = 'ACADEMIC';
    }
    if (!this.designation) {
      this.designation = 'Teacher';
    }
    if (!this.salaryType) {
      this.salaryType = 'MONTHLY';
    }
    if (this.baseSalary === undefined || this.baseSalary === null) {
      this.baseSalary = 0;
    }
    if (this.hourlyRate === undefined || this.hourlyRate === null) {
      this.hourlyRate = 0;
    }
  }
}
