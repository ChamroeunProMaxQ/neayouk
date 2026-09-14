import { BranchStatusEnum } from '@repo/contracts';
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
import { User } from '@src/user/entity/user.entity.js';

@Entity({ name: 'branches' })
export class Branch {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 36 })
  uuid!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'name_khmer', type: 'varchar', length: 255, nullable: true })
  nameKhmer!: string | null;

  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  motto!: string | null;

  @Column({ name: 'logo_url', type: 'varchar', length: 500, nullable: true })
  logoUrl!: string | null;

  @Column({ name: 'receipt_footer_terms', type: 'text', nullable: true })
  receiptFooterTerms!: string | null;

  @Column({
    name: 'receipt_signature_title',
    type: 'varchar',
    length: 100,
    nullable: true,
    default: 'Authorized Signature / Cashier',
  })
  receiptSignatureTitle!: string | null;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault!: boolean;

  @Column({
    type: 'enum',
    enum: BranchStatusEnum,
    default: BranchStatusEnum.ACTIVE,
  })
  status!: BranchStatusEnum;

  @Column({ name: 'admin_user_id', type: 'int', nullable: true })
  adminUserId!: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;

  @OneToMany(() => User, (user) => user.branch)
  users!: User[];

  @OneToMany('BranchIntegration', 'branch')
  integrations!: any[];

  @BeforeInsert()
  generateUuid() {
    if (!this.uuid) {
      this.uuid = randomUUID();
    }
    if (!this.status) {
      this.status = BranchStatusEnum.ACTIVE;
    }
  }
}
