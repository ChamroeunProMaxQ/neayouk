import { Injectable } from '@nestjs/common';

@Injectable()
export class NestLensGateService {
  async can(gate: string, action: string, subject: any, user: any): Promise<boolean> {
    return true;
  }
}
