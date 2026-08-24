import { randomUUID } from 'node:crypto';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  SemesterEnum,
  type GradingRuleComponent,
  type GradeScaleItem,
} from '@repo/contracts';

@Entity({ name: 'grading_rules' })
export class GradingRule {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 36 })
  uuid!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string;

  @Column({ name: 'academic_year', type: 'varchar', length: 20, nullable: true })
  academicYear!: string | null;

  @Column({
    type: 'enum',
    enum: SemesterEnum,
    nullable: true,
  })
  semester!: SemesterEnum | null;

  @Column({ type: 'json' })
  components!: GradingRuleComponent[];

  @Column({ name: 'grade_scale', type: 'json' })
  gradeScale!: GradeScaleItem[];

  @Column({ name: 'is_default', type: 'boolean', default: true })
  isDefault!: boolean;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;

  @BeforeInsert()
  generateUuid() {
    if (!this.uuid) {
      this.uuid = randomUUID();
    }
  }
}
