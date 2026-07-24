import { Sequelize } from 'sequelize';

export async function up({ context: sequelize }: { context: Sequelize }) {
  await sequelize.getQueryInterface().bulkInsert('exmaple', [
    {
      example: 'exmaple',
    },
  ]);
}

export async function down({ context: sequelize }: { context: Sequelize }) {
  await sequelize.getQueryInterface().bulkDelete('users', {
    example: 'example',
  });
}
