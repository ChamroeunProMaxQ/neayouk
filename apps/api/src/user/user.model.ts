import { UserStatusEnum, UserTypeEnum } from '@repo/shared';
import { randomUUID } from 'node:crypto';
import { DataTypes, type CreationOptional } from 'sequelize';
import { Column, Table } from 'sequelize-typescript';
import { hashPassword } from '../common/helper/password.helper.js';
import { BaseModel } from '../common/model/base.model.js';

@Table({
  tableName: 'users',
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export class User extends BaseModel<User> {
  @Column({
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  declare id: CreationOptional<number>;

  @Column({
    type: DataTypes.UUID,
    defaultValue: randomUUID(),
    allowNull: false,
  })
  declare uuid: CreationOptional<string>;

  @Column({
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  })
  declare username: string;

  @Column({
    type: DataTypes.STRING,
    allowNull: false,
    set(value: string) {
      // Hash the password before storing it in the database
      this.setDataValue('password', hashPassword(value));
    },
    get() {
      return ''; // Hide the password field when retrieving user data
    },
  })
  declare password: CreationOptional<string>;

  @Column({
    type: DataTypes.ENUM(...Object.values(UserTypeEnum)),
    allowNull: false,
    defaultValue: UserTypeEnum.CUSTOMER,
  })
  declare userType: CreationOptional<UserTypeEnum>;

  @Column({
    type: DataTypes.ENUM(...Object.values(UserStatusEnum)),
    allowNull: true,
    defaultValue: UserStatusEnum.ACTIVE,
  })
  declare status: CreationOptional<UserStatusEnum>;

  @Column({
    type: DataTypes.VIRTUAL,
    get(this: User) {
      return `user-${this.id}`;
    },
  })
  declare computedNameId: CreationOptional<string>;
}
