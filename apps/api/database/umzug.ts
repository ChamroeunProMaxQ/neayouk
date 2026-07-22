import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { fileURLToPath } from 'node:url';
import * as path from 'path';
import { Sequelize } from 'sequelize';
import type { Promisable } from 'umzug';
import { SequelizeStorage, Umzug } from 'umzug';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const sequelize = new Sequelize({
  dialect: 'mysql',
  host: 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const migrationsPath = path.join(__dirname, 'migrations');
console.log(`Migrations path: ${process.cwd()}`, migrationsPath);

export const migrator = new Umzug({
  migrations: {
    glob: [`*.js`, { cwd: migrationsPath }],
  },
  context: sequelize,
  storage: new SequelizeStorage({
    sequelize,
  }),
  logger: console,
  create: {
    folder: migrationsPath,
    template: generateTemplate,
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

export type Migration = typeof migrator._types.migration;
