import { NestLensModule } from "nestlens";

export const nestlenConfig = NestLensModule.forRoot({
    enabled: true,
    watchers: {
        exception: false,
        model: {
            enabled: true
        }
    },
    authorization: {
        allowedEnvironments: ['dev', 'stg', 'prod'],
    },
});