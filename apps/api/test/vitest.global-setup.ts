import { config } from 'dotenv';
import 'reflect-metadata';

config({
  path: '.env.test',
});

import { migrator, seeder, dataSource } from '../dist-db/umzug.js';

export async function setup() {
  console.log(
    '--- [Vitest Global Setup] Running database migrations & seeders ---',
  );
  try {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    await migrator.up();
    await seeder.up();
  } catch (err: any) {
    console.error('GLOBAL SETUP ERROR:', err);
    throw err;
  }
}

export async function teardown() {
  console.log('--- [Vitest Global Teardown] Cleaning up database schema ---');
  try {
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    await dataSource.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  } catch (err) {
    // Ignore teardown schema drop errors
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}
