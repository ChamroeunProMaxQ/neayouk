import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { StudentPayment } from '@src/student/entity/student-payment.entity.js';
import type { Student } from '@src/student/entity/student.entity.js';
import type { User } from '@src/user/entity/user.entity.js';

@Entity({ name: 'payment_reminders' })
export class PaymentReminder {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'invoice_id', type: 'int' })
  invoiceId!: number;

  @ManyToOne('StudentPayment', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  declare invoice?: StudentPayment;

  @Column({ name: 'student_id', type: 'int' })
  studentId!: number;

  @ManyToOne('Student', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  declare student?: Student;

  @Column({ name: 'reminder_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  reminderDate!: Date;

  @Column({ type: 'varchar', length: 50, default: 'IN_APP' })
  channel!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ name: 'sent_by', type: 'int', nullable: true })
  sentBy!: number | null;

  @ManyToOne('User', { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'sent_by' })
  declare sentByUser?: User | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
