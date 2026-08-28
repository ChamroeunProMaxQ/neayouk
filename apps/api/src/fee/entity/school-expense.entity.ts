import { randomUUID } from 'node:crypto';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ExpenseCategoryEnum, ExpenseStatusEnum, PaymentMethodEnum } from '@repo/contracts';
import type { User } from '@src/user/entity/user.entity.js';

@Entity({ name: 'school_expenses' })
export class SchoolExpense {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 36 })
  uuid!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({
    type: 'enum',
    enum: ExpenseCategoryEnum,
    default: ExpenseCategoryEnum.OTHER,
  })
  category!: ExpenseCategoryEnum;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  amount!: number;

  @Column({ name: 'expense_date', type: 'date', default: () => 'CURRENT_DATE' })
  expenseDate!: Date | string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  vendor!: string | null;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: PaymentMethodEnum,
    default: PaymentMethodEnum.CASH,
  })
  paymentMethod!: PaymentMethodEnum;

  @Column({
    type: 'enum',
    enum: ExpenseStatusEnum,
    default: ExpenseStatusEnum.PENDING,
  })
  status!: ExpenseStatusEnum;

  @Column({ name: 'receipt_ref', type: 'varchar', length: 100, nullable: true })
  receiptRef!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'recorded_by', type: 'int', nullable: true })
  recordedBy!: number | null;

  @ManyToOne('User', { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'recorded_by' })
  declare recordedByUser?: User | null;

  @Column({ name: 'approved_by', type: 'int', nullable: true })
  approvedBy!: number | null;

  @ManyToOne('User', { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'approved_by' })
  declare approvedByUser?: User | null;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt!: Date | null;

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
