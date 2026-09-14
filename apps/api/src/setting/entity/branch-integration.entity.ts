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
import { Branch } from '@src/branch/entity/branch.entity.js';

export interface TelegramNotificationEvents {
  attendance: boolean;
  payment: boolean;
  leave: boolean;
  announcement: boolean;
}

@Entity({ name: 'branch_integrations' })
export class BranchIntegration {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 36, unique: true })
  uuid!: string;

  @Column({ name: 'branch_id', type: 'int' })
  branchId!: number;

  @ManyToOne(() => Branch, (branch) => branch.integrations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'branch_id' })
  branch!: Branch;

  @Column({ type: 'varchar', length: 50, default: 'TELEGRAM' })
  provider!: string;

  @Column({ name: 'is_enabled', type: 'boolean', default: false })
  isEnabled!: boolean;

  @Column({ name: 'bot_token_encrypted', type: 'text', nullable: true })
  botTokenEncrypted!: string | null;

  @Column({ name: 'bot_username', type: 'varchar', length: 100, nullable: true })
  botUsername!: string | null;

  @Column({ name: 'default_chat_id', type: 'varchar', length: 100, nullable: true })
  defaultChatId!: string | null;

  @Column({ name: 'attendance_chat_id', type: 'varchar', length: 100, nullable: true })
  attendanceChatId!: string | null;

  @Column({ name: 'payment_chat_id', type: 'varchar', length: 100, nullable: true })
  paymentChatId!: string | null;

  @Column({ name: 'leave_chat_id', type: 'varchar', length: 100, nullable: true })
  leaveChatId!: string | null;

  @Column({ name: 'announcement_chat_id', type: 'varchar', length: 100, nullable: true })
  announcementChatId!: string | null;

  @Column({
    name: 'notification_events',
    type: 'jsonb',
    default: {
      attendance: true,
      payment: true,
      leave: true,
      announcement: false,
    },
  })
  notificationEvents!: TelegramNotificationEvents;

  @Column({ name: 'last_tested_at', type: 'timestamp', nullable: true })
  lastTestedAt!: Date | null;

  @Column({
    name: 'last_test_status',
    type: 'varchar',
    length: 50,
    default: 'NOT_TESTED',
  })
  lastTestStatus!: string;

  @Column({ name: 'last_error_message', type: 'text', nullable: true })
  lastErrorMessage!: string | null;

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
