import type { DataSource } from 'typeorm';

export async function up({ context }: { context: DataSource | (() => Promise<DataSource>) }) {
  const dataSource = await (typeof context === 'function' ? context() : context);
  await dataSource.query(`INSERT INTO example (column_name) VALUES ('value');`);
}

export async function down({ context }: { context: DataSource | (() => Promise<DataSource>) }) {
  const dataSource = await (typeof context === 'function' ? context() : context);
  await dataSource.query(`DELETE FROM example;`);
}
