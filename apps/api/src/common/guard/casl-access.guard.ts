import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { AccessGuard } from 'nest-casl';

@Injectable()
export class CaslAccessGuard extends AccessGuard {
  override async canActivate(context: ExecutionContext): Promise<boolean> {
    const isAllowed = await super.canActivate(context);

    if (!isAllowed) {
      throw new ForbiddenException(
        'You do not have permission to access or modify this resource  zz',
      );
    }

    return true;
  }
}
