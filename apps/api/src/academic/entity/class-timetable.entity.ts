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
import { DayOfWeekEnum, type ClassTimetableAttribute } from '@repo/contracts';
import type { Class } from './class.entity.js';

@Entity({ name: 'class_timetables' })
export class ClassTimetable implements ClassTimetableAttribute {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 36 })
  uuid!: string;

  @Column({ name: 'class_id', type: 'int' })
  classId!: number;

  @ManyToOne('Class', (c: Class) => c.timetables, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  declare class?: Class;

  @Column({
    name: 'day_of_week',
    type: 'enum',
    enum: DayOfWeekEnum,
    default: DayOfWeekEnum.MONDAY,
  })
  dayOfWeek!: DayOfWeekEnum;

  @Column({ type: 'varchar', length: 255 })
  subject!: string;

  @Column({ name: 'subject_code', type: 'varchar', length: 50, nullable: true })
  subjectCode!: string | null;

  @Column({
    name: 'teacher_id',
    type: 'int',
    nullable: true,
  })
  teacherId!: number | null;

  @Column({
    name: 'teacher_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  teacherName!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  room!: string | null;

  @Column({ name: 'start_time', type: 'varchar', length: 10 })
  startTime!: string;

  @Column({ name: 'end_time', type: 'varchar', length: 10 })
  endTime!: string;

  @Column({
    name: 'color_tag',
    type: 'varchar',
    length: 50,
    default: '#45AC5E',
    nullable: true,
  })
  colorTag!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

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
