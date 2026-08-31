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
import { FeeCategoryEnum, BillingCycleEnum } from '@repo/contracts';
import { Branch } from '@src/branch/entity/branch.entity.js';
import type { Program } from '@src/academic/entity/program.entity.js';

@Entity({ name: 'fee_structures' })
export class FeeStructure {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 36 })
  uuid!: string;

  @Column({ name: 'branch_id', type: 'int', nullable: true })
  branchId!: number | null;

  @ManyToOne(() => Branch, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'branch_id' })
  branch?: Branch | null;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({
    type: 'enum',
    enum: FeeCategoryEnum,
    default: FeeCategoryEnum.TUITION,
  })
  category!: FeeCategoryEnum;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.0,
  })
  amount!: number;

  @Column({
    name: 'billing_cycle',
    type: 'enum',
    enum: BillingCycleEnum,
    default: BillingCycleEnum.MONTHLY,
  })
  billingCycle!: BillingCycleEnum;

  @Column({ name: 'is_optional', type: 'boolean', default: false })
  isOptional!: boolean;

  @Column({ name: 'program_id', type: 'int', nullable: true })
  programId!: number | null;

  @ManyToOne('Program', { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'program_id' })
  declare program?: Program | null;

  @Column({ name: 'academic_year', type: 'varchar', length: 20, nullable: true })
  academicYear!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

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
