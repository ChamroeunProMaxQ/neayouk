import { SetMetadata } from '@nestjs/common';
import type { UserTypeEnum } from '@repo/contracts';

export const USER_TYPES_KEY = 'user_types';
export const UserTypes = (...userTypes: UserTypeEnum[]) => {
  return SetMetadata(USER_TYPES_KEY, userTypes);
};
