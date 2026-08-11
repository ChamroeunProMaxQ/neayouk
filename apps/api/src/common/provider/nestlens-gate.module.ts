import { Global, Module } from '@nestjs/common';
import { NESTLENS_GATE_SERVICE } from 'nestlens';
import { NestLensGateService } from './nestlens-gate.provider.js';

@Global()
@Module({
  providers: [
    NestLensGateService,
    {
      provide: NESTLENS_GATE_SERVICE,
      useExisting: NestLensGateService,
    },
  ],
  exports: [NESTLENS_GATE_SERVICE, NestLensGateService],
})
export class NestLensGateModule {}
