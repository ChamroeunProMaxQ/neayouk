import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { fileURLToPath } from 'node:url';
import * as path from 'path';
import type { Promisable, UmzugStorage } from 'umzug';
import { Umzug } from 'umzug';
import { DataSource } from 'typeorm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nodeEnv = process.env.NODE_ENV;
dotenv.config({
  path: nodeEnv === 'test' ? '.env.test' : '.env',
});

const DB_HOST = process.env.DB_HOST ?? 'localhost';
const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432;
const DB_NAME = process.env.DB_NAME;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD?.toString();

export const dataSource = new DataSource({
  type: 'postgres',
  host: DB_HOST,
  port: DB_PORT,
  database: DB_NAME,
  username: DB_USER,
  password: DB_PASSWORD,
});

console.log('running in env: ', nodeEnv ?? 'development');

const migrationsPath = path.join(__dirname, 'migrations');
const seederPath = path.join(__dirname, 'seeds');

const isCompiled = import.meta.url.endsWith('.js');
const ext = isCompiled ? 'js' : 'ts';

async function ensureInitialized() {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
}

function getTypeOrmStorage(tableName: string): UmzugStorage<DataSource> {
  return {
    async logMigration({ name }) {
      await ensureInitialized();
      await dataSource.query(
        `CREATE TABLE IF NOT EXISTS "${tableName}" ("name" VARCHAR(255) NOT NULL PRIMARY KEY)`,
      );
      await dataSource.query(
        `INSERT INTO "${tableName}" ("name") VALUES ($1) ON CONFLICT ("name") DO NOTHING`,
        [name],
      );
    },
    async unlogMigration({ name }) {
      await ensureInitialized();
      await dataSource.query(
        `CREATE TABLE IF NOT EXISTS "${tableName}" ("name" VARCHAR(255) NOT NULL PRIMARY KEY)`,
      );
      await dataSource.query(
        `DELETE FROM "${tableName}" WHERE "name" = $1`,
        [name],
      );
    },
    async executed() {
      await ensureInitialized();
      await dataSource.query(
        `CREATE TABLE IF NOT EXISTS "${tableName}" ("name" VARCHAR(255) NOT NULL PRIMARY KEY)`,
      );
      const records: { name: string }[] = await dataSource.query(
        `SELECT "name" FROM "${tableName}" ORDER BY "name" ASC`,
      );
      return records.map((r) => r.name);
    },
  };
}

export const migrator = new Umzug({
  migrations: {
    glob: [`*.${ext}`, { cwd: migrationsPath }],
  },
  context: async () => {
    await ensureInitialized();
    return dataSource;
  },
  storage: getTypeOrmStorage('MigrationMeta'),
  logger: console,
  create: {
    folder: migrationsPath,
    template: generateTemplate,
  },
});

export const seeder = new Umzug({
  migrations: {
    glob: [`*.${ext}`, { cwd: seederPath }],
  },
  context: async () => {
    await ensureInitialized();
    return dataSource;
  },
  storage: getTypeOrmStorage('SeederMeta'),
  logger: console,
  create: {
    folder: seederPath,
    template: generateSeederTemplate,
  },
});

function generateTemplate(filepath: string): Promisable<[string, string][]> {
  console.log(`Creating migration file at: ${filepath}`);
  let tableName = 'example';
  let templatePath = '';
  const isCreatingTable =
    filepath.includes('create-') && filepath.includes('-table');
  if (isCreatingTable) {
    tableName = filepath.replace(/.*create-(.*)-table.*/, '$1');
    templatePath = path.join(__dirname, 'template/create-table.template.ts');
  } else {
    templatePath = path.join(__dirname, 'template/add-column.template.ts');
  }
  return [
    [
      filepath,
      fs.readFileSync(templatePath).toString().replaceAll('example', tableName),
    ],
  ];
}

function generateSeederTemplate(
  filepath: string,
): Promisable<[string, string][]> {
  const templatePath = path.join(__dirname, 'template/create-seed.template.ts');
  return [
    [filepath, fs.readFileSync(templatePath, 'utf8')],
  ];
}

export type Migration = typeof migrator._types.migration;
