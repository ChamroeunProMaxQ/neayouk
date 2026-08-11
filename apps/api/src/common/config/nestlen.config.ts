import { VERSION_NEUTRAL } from "@nestjs/common";
import { VERSION_METADATA } from "@nestjs/common/constants.js";
import { NestLensModule } from "nestlens";

export const nestlenConfig = NestLensModule.forRoot({
    enabled: true,
    watchers: {
        exception: false,
        log: {
            enabled: true,
            minLevel: 'log',
        },
        gate: false,
        model: {
            enabled: true
        }
    },
    authorization: {
        allowedEnvironments: ['dev', 'stg', 'prod'],
    },
});

// Mark NestLens controllers as VERSION_NEUTRAL so they aren't forced into /v1
nestlenConfig.controllers?.forEach((controller) => {
    if (typeof controller === 'function') {
        Reflect.defineMetadata(VERSION_METADATA, [VERSION_NEUTRAL], controller);
    }
});