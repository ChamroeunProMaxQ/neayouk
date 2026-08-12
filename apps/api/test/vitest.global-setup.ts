import { config } from 'dotenv';
import 'reflect-metadata';

config({
  path: '.env.test',
});

import { migrator, seeder, dataSource } from '../database/umzug.js';

export async function setup() {
  console.log('--- [Vitest Global Setup] Running database migrations & seeders ---');
  await migrator.up();
  await seeder.up();
}

export async function teardown() {
  console.log('--- [Vitest Global Teardown] Cleaning up database schema ---');
  await seeder.down({ to: 0 });
  await migrator.down({ to: 0 });
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }
}
