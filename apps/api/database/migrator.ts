//require('ts-node/register');

import { migrator } from './umzug.js';

await migrator.runAsCLI();
