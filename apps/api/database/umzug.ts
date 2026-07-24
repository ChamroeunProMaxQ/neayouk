import * as fs from 'fs';
import { fileURLToPath } from 'node:url';
import * as path from 'path';
import { Sequelize, type Options } from 'sequelize';
import type { Promisable } from 'umzug';
import { SequelizeStorage, Umzug } from 'umzug';
import { envConfig } from '../src/common/config/env.config.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sequelizeOptions: Options = {
  dialect: 'mysql',
  host: envConfig.DB_HOST ?? 'localhost',
  port: envConfig.DB_PORT ? +envConfig.DB_PORT : 3306,
  database: envConfig.DB_NAME,
  username: envConfig.DB_USER,
  password: envConfig.DB_PASSWORD?.toString(),
};

const sequelize = new Sequelize(sequelizeOptions);
const migrationsPath = path.join(__dirname, 'migrations');
const seederPath = path.join(__dirname, 'seeds');

// console.log('sequelize', sequelize);
// console.log(`Migrations path: ${process.cwd()}`, migrationsPath);

export const migrator = new Umzug({
  migrations: {
    glob: [`*.@(ts|js)`, { cwd: migrationsPath }],
  },
  context: sequelize,
  storage: getSequelizeStorage('MigrationMeta'),
  logger: console,
  create: {
    folder: migrationsPath,
    template: generateTemplate,
  },
});

export const seeder = new Umzug({
  migrations: {
    glob: [`*.@(ts|js)`, { cwd: seederPath }],
  },
  context: sequelize,
  storage: getSequelizeStorage('SeederMeta'),
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
    // read template from filesystem
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
    // read template from filesystem
    [filepath, fs.readFileSync(templatePath, 'utf8')],
  ];
}

function getSequelizeStorage(name: string) {
  return new SequelizeStorage({
    sequelize,
    tableName: name,
    modelName: name,
  });
}

export type Migration = typeof migrator._types.migration;
