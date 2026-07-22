import { DataTypes, Sequelize } from 'sequelize';
import type { MigrationFn } from 'umzug';

export const up: MigrationFn<Sequelize> = async ({ context }) => {
  await context.getQueryInterface().addColumn('example', 'newColumn', {
    type: DataTypes.STRING,
    allowNull: true,
  });
};

export const down: MigrationFn<Sequelize> = async ({ context }) => {
  await context.getQueryInterface().removeColumn('example', 'newColumn');
};
