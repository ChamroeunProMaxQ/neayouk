import { OpenTelemetryModule } from '@metinseylan/nestjs-opentelemetry';

export const openTelemetryConfig = OpenTelemetryModule.forRoot({
  serviceName: 'nestjs-prometheus',
});
