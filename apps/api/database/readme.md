This example shows how migrations can be written in typescript and run with the help of `ts-node`.

Note:

- The entrypoint, `migrate.js`, calls `require('ts-node/register')` before requiring the `umzug.ts` module. This enables loading of typescript modules directly, and avoids the complexity of having a separate compilation target folder.
- `umzug.ts` exports a migration type with `export type Migration = typeof migrator._types.migration;`. This allows typescript migration files to get strongly typed parameters by importing it.
- Need to build the project before running the migration commands, because the migrator is located in the `dist` folder after build.

```bash
node migrate --help # show CLI help

node .\dist\database\migrator pending # show pending migrations
node .\dist\database\migrator up # apply migrations
node .\dist\database\migrator down # revert the last migration
node .\dist\database\migrator down --to 0 # revert all migrations
node .\dist\database\migrator up --step 2 # run only two migrations

# use ts-node to run create command, which needs to load the migration template file
ts-node .\database\migrator create --name new-migration.ts # create a new migration file
```
