import { UserStatusEnum, UserTypeEnum, type UserAttribute } from '@repo/contracts';
import { randomUUID } from 'node:crypto';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { hashPassword } from '@src/common/helper/password.helper.js';
import { UserToken } from '@src/user-token/entity/user-token.entity.js';

@Entity({ name: 'users' })
export class User implements UserAttribute {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 36 })
  uuid!: string;

  @Column({ type: 'varchar', unique: true })
  username!: string;

  @Column({ type: 'varchar' })
  password!: string;

  @Column({
    name: 'user_type',
    type: 'enum',
    enum: UserTypeEnum,
    default: UserTypeEnum.CUSTOMER,
  })
  userType!: UserTypeEnum;

  @Column({
    type: 'enum',
    enum: UserStatusEnum,
    default: UserStatusEnum.ACTIVE,
    nullable: true,
  })
  status!: UserStatusEnum;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt!: Date | null;

  @OneToMany(() => UserToken, (token) => token.user)
  declare tokens: UserToken[];

  get computedNameId(): string {
    return `user-${this.id}`;
  }

  @BeforeInsert()
  generateUuidAndHashPassword() {
    if (!this.uuid) {
      this.uuid = randomUUID();
    }
    if (!this.userType) {
      this.userType = UserTypeEnum.CUSTOMER;
    }
    if (!this.status) {
      this.status = UserStatusEnum.ACTIVE;
    }
    if (this.password && !this.password.includes(':')) {
      this.password = hashPassword(this.password);
    }
  }

  @BeforeUpdate()
  hashPasswordOnUpdate() {
    if (this.password && !this.password.includes(':')) {
      this.password = hashPassword(this.password);
    }
  }

  toJSON() {
    return {
      ...this,
      id: this.id,
      uuid: this.uuid,
      username: this.username,
      password: '',
      userType: this.userType,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      computedNameId: this.computedNameId,
    };
  }
}
