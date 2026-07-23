import { PrometheusModule } from '@willsoto/nestjs-prometheus';

export const prometheusConfig = PrometheusModule.register({
  //   path: '/metrics',
  global: true,
  defaultLabels: {
    app: 'nestjs-prometheus',
  },
  defaultMetrics: {
    enabled: true,
  },
});
