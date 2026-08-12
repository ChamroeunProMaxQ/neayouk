import { seeder, dataSource } from './umzug.js';

try {
  await seeder.runAsCLI();
} finally {
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }
}
