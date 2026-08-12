import { Like, type FindOptionsWhere } from 'typeorm';
import { UserStatusEnum } from '@repo/contracts';
import type { User } from './entity/user.entity.js';

export class UserScopeBuilder {
  private where: FindOptionsWhere<User> = {};

  static create() {
    return new UserScopeBuilder();
  }

  filterByName(name?: string) {
    if (name) {
      this.where.username = Like(`%${name}%`);
    }
    return this;
  }

  activeOnly() {
    this.where.status = UserStatusEnum.ACTIVE;
    return this;
  }

  build(): FindOptionsWhere<User> {
    return this.where;
  }
}
