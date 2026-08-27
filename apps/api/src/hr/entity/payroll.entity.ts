import { randomUUID } from 'node:crypto';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { User } from '@src/user/entity/user.entity.js';
import type { Staff } from './staff.entity.js';
import type { PayrollItem } from './payroll-item.entity.js';

@Entity({ name: 'payrolls' })
export class Payroll {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 36 })
  uuid!: string;

  @Column({
    name: 'payroll_number',
    type: 'varchar',
    length: 100,
    unique: true,
  })
  payrollNumber!: string;

  @Column({ name: 'staff_id', type: 'int' })
  staffId!: number;

  @ManyToOne('Staff', (s: Staff) => s.payrolls, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'staff_id' })
  declare staff?: Staff;

  @Column({ type: 'int' })
  year!: number;

  @Column({ type: 'int' })
  month!: number;

  @Column({ name: 'start_date', type: 'date' })
  startDate!: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate!: string;

  @Column({ name: 'working_days', type: 'int', default: 22 })
  workingDays!: number;

  @Column({ name: 'holiday_days', type: 'int', default: 0 })
  holidayDays!: number;

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
    name: 'total_hours_worked',
    type: 'decimal',
    precision: 8,
    scale: 2,
    default: 0.0,
  })
  totalHoursWorked!: number;

  @Column({
    name: 'calculated_base_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  calculatedBaseAmount!: number;

  @Column({
    name: 'total_bonus',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  totalBonus!: number;

  @Column({
    name: 'total_deduction',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  totalDeduction!: number;

  @Column({
    name: 'gross_salary',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  grossSalary!: number;

  @Column({
    name: 'net_salary',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  netSalary!: number;

  @Column({ type: 'varchar', length: 30, default: 'DRAFT' })
  status!: 'DRAFT' | 'PAID' | 'CANCELLED';

  @Column({
    name: 'payment_method',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  paymentMethod!: string | null;

  @Column({ name: 'payment_date', type: 'timestamp', nullable: true })
  paymentDate!: Date | null;

  @Column({
    name: 'payment_reference',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  paymentReference!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'processed_by', type: 'int', nullable: true })
  processedBy!: number | null;

  @ManyToOne('User', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'processed_by' })
  declare processedByUser?: User | null;

  @OneToMany('PayrollItem', (item: PayrollItem) => item.payroll)
  declare items?: PayrollItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @BeforeInsert()
  generateDefaults() {
    if (!this.uuid) {
      this.uuid = randomUUID();
    }
    if (!this.status) {
      this.status = 'DRAFT';
    }
    if (this.baseSalary === undefined || this.baseSalary === null) {
      this.baseSalary = 0;
    }
    if (this.hourlyRate === undefined || this.hourlyRate === null) {
      this.hourlyRate = 0;
    }
    if (this.totalHoursWorked === undefined || this.totalHoursWorked === null) {
      this.totalHoursWorked = 0;
    }
    if (this.calculatedBaseAmount === undefined || this.calculatedBaseAmount === null) {
      this.calculatedBaseAmount = 0;
    }
    if (this.totalBonus === undefined || this.totalBonus === null) {
      this.totalBonus = 0;
    }
    if (this.totalDeduction === undefined || this.totalDeduction === null) {
      this.totalDeduction = 0;
    }
    if (this.grossSalary === undefined || this.grossSalary === null) {
      this.grossSalary = 0;
    }
    if (this.netSalary === undefined || this.netSalary === null) {
      this.netSalary = 0;
    }
  }
}
