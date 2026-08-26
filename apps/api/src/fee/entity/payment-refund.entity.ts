import { randomUUID } from 'node:crypto';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PaymentMethodEnum } from '@repo/contracts';
import type { StudentPayment } from '@src/student/entity/student-payment.entity.js';
import type { User } from '@src/user/entity/user.entity.js';

@Entity({ name: 'payment_refunds' })
export class PaymentRefund {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 36 })
  uuid!: string;

  @Column({ name: 'payment_id', type: 'int', nullable: true })
  paymentId!: number | null;

  @Column({ name: 'invoice_id', type: 'int' })
  invoiceId!: number;

  @ManyToOne('StudentPayment', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  declare invoice?: StudentPayment;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  amount!: number;

  @Column({ type: 'text' })
  reason!: string;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: PaymentMethodEnum,
    default: PaymentMethodEnum.CASH,
  })
  paymentMethod!: PaymentMethodEnum;

  @Column({ name: 'refunded_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  refundedAt!: Date;

  @Column({ name: 'processed_by', type: 'int', nullable: true })
  processedBy!: number | null;

  @ManyToOne('User', { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'processed_by' })
  declare processedByUser?: User | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @BeforeInsert()
  generateUuid() {
    if (!this.uuid) {
      this.uuid = randomUUID();
    }
  }
}
