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
import type { StudentPayment } from './student-payment.entity.js';

@Entity({ name: 'payment_items' })
export class PaymentItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 36 })
  uuid!: string;

  @Column({ name: 'payment_id', type: 'int' })
  paymentId!: number;

  @ManyToOne('StudentPayment', (payment: StudentPayment) => payment.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'payment_id' })
  declare payment?: StudentPayment;

  @Column({ name: 'fee_structure_id', type: 'int', nullable: true })
  feeStructureId!: number | null;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  amount!: number;

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
