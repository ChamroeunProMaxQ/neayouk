import { migrator, dataSource } from './umzug.js';

try {
  await migrator.runAsCLI();
} finally {
  if (dataSource.isInitialized) {
    await dataSource.destroy();
  }
}
