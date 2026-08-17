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
import { jsonArrayTransformer } from '@src/common/helper/json-transformer.helper.js';
import type { Class } from './class.entity.js';

@Entity({ name: 'programs' })
export class Program {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 36 })
  uuid!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string;

  @Column({
    name: 'books',
    type: 'json',
    nullable: true,
    transformer: jsonArrayTransformer,
  })
  books!: string[];

  @Column({
    name: 'grade_levels',
    type: 'json',
    nullable: true,
    transformer: jsonArrayTransformer,
  })
  gradeLevels!: string[];

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status!: 'ACTIVE' | 'INACTIVE';

  @OneToMany('Class', (cls: Class) => cls.program)
  declare classes?: Class[];

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
