import {
  TokenStatusEnum,
  TokenTypeEnum,
  type UserTokenAttribute,
} from '@repo/contracts';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@src/user/entity/user.entity.js';

@Entity({ name: 'user_tokens' })
export class UserToken implements UserTokenAttribute {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  token!: string;

  @Column({
    name: 'token_type',
    type: 'enum',
    enum: TokenTypeEnum,
    default: TokenTypeEnum.REFRESH_TOKEN,
  })
  tokenType!: TokenTypeEnum;

  @Column({ name: 'exp_date', type: 'datetime' })
  expDate!: Date;

  @Column({
    type: 'enum',
    enum: TokenStatusEnum,
    default: TokenStatusEnum.ACTIVE,
  })
  status!: TokenStatusEnum;

  @Column({ name: 'user_id' })
  userId!: number;

  @ManyToOne(() => User, (user) => user.tokens, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  getUser(): Promise<User> {
    return Promise.resolve(this.user);
  }
}
