import { Global, Module } from '@nestjs/common';
import { NESTLENS_MODEL_SUBSCRIBER } from 'nestlens';
import { NestLensModelSubscriber } from './nestlens-model-subscriber.provider.js';

@Global()
@Module({
  providers: [
    NestLensModelSubscriber,
    {
      provide: NESTLENS_MODEL_SUBSCRIBER,
      useExisting: NestLensModelSubscriber,
    },
  ],
  exports: [NESTLENS_MODEL_SUBSCRIBER, NestLensModelSubscriber],
})
export class NestLensModelSubscriberModule {}
