import { envConfig } from './env.config.js';
import { openTelemetryConfig } from './open-telemetry.config.js';
import { prometheusConfig } from './prometheus.config.js';

const isOservableEnable = envConfig.OBSERVABLE_ENABLE;

export const oberservableConfig = isOservableEnable
  ? [prometheusConfig, openTelemetryConfig]
  : [];
