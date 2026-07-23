import { makeCounterProvider } from "@willsoto/nestjs-prometheus";

export const HttpRequestsCounterProvider = makeCounterProvider({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
});
