import { access } from 'node:fs/promises';

const modulePath = await (async () => {
  try {
    await access(new URL('./umzug.js', import.meta.url));
    return './umzug.js';
  } catch {
    return './umzug.ts';
  }
})();

const { seeder } = await import(modulePath);

await seeder.runAsCLI();
