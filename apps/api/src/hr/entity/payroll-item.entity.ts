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
import type { Payroll } from './payroll.entity.js';

@Entity({ name: 'payroll_items' })
export class PayrollItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 36 })
  uuid!: string;

  @Column({ name: 'payroll_id', type: 'int' })
  payrollId!: number;

  @ManyToOne('Payroll', (p: Payroll) => p.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payroll_id' })
  declare payroll?: Payroll;

  @Column({ name: 'item_type', type: 'varchar', length: 30, default: 'BONUS' })
  itemType!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  amount!: number;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @BeforeInsert()
  generateDefaults() {
    if (!this.uuid) {
      this.uuid = randomUUID();
    }
    if (!this.itemType) {
      this.itemType = 'BONUS';
    }
    if (this.amount === undefined || this.amount === null) {
      this.amount = 0;
    }
  }
}
