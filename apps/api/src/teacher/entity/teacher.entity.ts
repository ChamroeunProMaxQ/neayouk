import { randomUUID } from 'node:crypto';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { User } from '@src/user/entity/user.entity.js';
import type { Class } from '@src/academic/entity/class.entity.js';

@Entity({ name: 'teachers' })
export class Teacher {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 36 })
  uuid!: string;

  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId!: number | null;

  @ManyToOne('User', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  declare user?: User | null;

  @Column({
    name: 'teacher_code',
    type: 'varchar',
    length: 50,
    unique: true,
    nullable: true,
  })
  teacherCode!: string | null;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'name_km', type: 'varchar', length: 255, nullable: true })
  nameKm!: string | null;

  @Column({ type: 'varchar', length: 16, default: 'MALE' })
  gender!: 'MALE' | 'FEMALE' | 'OTHER';

  @Column({
    name: 'date_of_birth',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  dateOfBirth!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({
    name: 'salary_in_hour',
    type: 'decimal',
    precision: 8,
    scale: 2,
    default: 0,
  })
  salaryInHour!: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  specialization!: string | null;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @Column({ type: 'varchar', length: 26, default: 'ACTIVE' })
  status!: string;

  @OneToMany('Class', (c: Class) => c.teacher)
  declare classes?: Class[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;

  @BeforeInsert()
  generateDefaults() {
    if (!this.uuid) {
      this.uuid = randomUUID();
    }
    if (!this.status) {
      this.status = 'ACTIVE';
    }
    if (!this.gender) {
      this.gender = 'MALE';
    }
    if (this.salaryInHour === undefined || this.salaryInHour === null) {
      this.salaryInHour = 0;
    }
  }
}
