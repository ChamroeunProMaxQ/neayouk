import {
  TokenStatusEnum,
  TokenTypeEnum,
  type UserTokenAttribute,
} from '@repo/shared';
import {
  DataTypes,
  type BelongsToGetAssociationMixin,
  type CreationOptional,
  type NonAttribute,
} from 'sequelize';
import { BelongsTo, Column, ForeignKey, Table } from 'sequelize-typescript';
import { BaseModel } from '../../common/model/base.model.js';
import { User } from '../../user/model/user.model.js';

@Table({
  tableName: 'user_tokens',
  timestamps: true,
  underscored: true,
})
export class UserToken
  extends BaseModel<UserToken>
  implements UserTokenAttribute
{
  @Column({
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  })
  declare id: CreationOptional<number>;

  @Column({
    type: DataTypes.STRING,
    allowNull: false,
  })
  declare token: string;

  @Column({
    type: DataTypes.ENUM(...Object.values(TokenTypeEnum)),
    allowNull: false,
    defaultValue: TokenTypeEnum.REFRESH_TOKEN,
  })
  declare tokenType: CreationOptional<TokenTypeEnum>;

  @Column({
    type: DataTypes.DATE,
    allowNull: false,
  })
  declare expDate: Date;

  @Column({
    type: DataTypes.ENUM(...Object.values(TokenStatusEnum)),
    allowNull: false,
    defaultValue: TokenStatusEnum.ACTIVE,
  })
  declare status: CreationOptional<TokenStatusEnum>;

  @ForeignKey(() => User)
  @Column({
    type: DataTypes.INTEGER,
    allowNull: false,
  })
  declare userId: number;

  @BelongsTo(() => User)
  declare user: NonAttribute<User>;

  declare getUser: BelongsToGetAssociationMixin<User>;
}
