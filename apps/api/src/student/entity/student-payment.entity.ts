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
import { PaymentStatusEnum, PaymentMethodEnum } from '@repo/contracts';
import type { Class } from '@src/academic/entity/class.entity.js';
import type { Student } from './student.entity.js';
import type { PaymentItem } from './payment-item.entity.js';

@Entity({ name: 'student_payments' })
export class StudentPayment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 36 })
  uuid!: string;

  @Column({ name: 'payment_number', type: 'varchar', length: 100, nullable: true })
  paymentNumber!: string | null;

  @Column({ name: 'student_id', type: 'int' })
  studentId!: number;

  @Column({ name: 'class_id', type: 'int', nullable: true })
  classId!: number | null;

  @ManyToOne('Student', (student: Student) => student.payments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'student_id' })
  declare student: Student;

  @ManyToOne('Class', (cls: Class) => cls.payments, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'class_id' })
  declare class?: Class | null;

  @OneToMany('PaymentItem', (item: PaymentItem) => item.payment, {
    cascade: true,
  })
  declare items?: PaymentItem[];

  @Column({ name: 'billing_year', type: 'int' })
  billingYear!: number;

  @Column({ name: 'billing_month', type: 'int' })
  billingMonth!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  subtotal!: number;

  @Column({
    name: 'discount_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  discountAmount!: number;

  @Column({
    name: 'total_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  totalAmount!: number;

  @Column({
    name: 'amount_due',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amountDue!: number;

  @Column({
    name: 'amount_paid',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amountPaid!: number;

  @Column({
    name: 'discount_applied',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  discountApplied!: number;

  @Column({
    type: 'enum',
    enum: PaymentStatusEnum,
    default: PaymentStatusEnum.PAID,
  })
  status!: PaymentStatusEnum;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: PaymentMethodEnum,
    default: PaymentMethodEnum.CASH,
    nullable: true,
  })
  paymentMethod!: PaymentMethodEnum;

  @Column({
    name: 'receipt_number',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  receiptNumber!: string | null;

  @Column({ name: 'issue_date', type: 'date', nullable: true })
  issueDate!: Date | string | null;

  @Column({ name: 'due_date', type: 'date', nullable: true })
  dueDate!: Date | string | null;

  @Column({
    name: 'paid_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: true,
  })
  paidAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'recorded_by', type: 'int', nullable: true })
  recordedBy!: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @BeforeInsert()
  generateUuid() {
    if (!this.uuid) {
      this.uuid = randomUUID();
    }
  }
}
