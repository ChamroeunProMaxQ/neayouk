import { NestLensModule } from "nestlens";

export const nestlenConfig = NestLensModule.forRoot({
    enabled: true,
    watchers: {
        exception: false,
        log: {
            enabled: true,
            minLevel: 'log',
        },
        gate: {
            enabled: true,
        },
        model: {
            enabled: true
        }
    },
    authorization: {
        allowedEnvironments: ['dev', 'stg', 'prod'],
    },
});