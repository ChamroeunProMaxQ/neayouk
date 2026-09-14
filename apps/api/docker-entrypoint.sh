#!/bin/sh
set -e

echo "Starting API entrypoint..."

# Wait for PostgreSQL to become available
if [ -n "$DB_HOST" ]; then
  echo "Waiting for database at $DB_HOST:${DB_PORT:-5432}..."
  until pg_isready -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" > /dev/null 2>&1; do
    echo "PostgreSQL is unavailable - sleeping 1s..."
    sleep 1
  done
  echo "PostgreSQL is ready!"
fi

# Run migrations if enabled (default: true)
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "Applying database migrations..."
  if [ -f "dist-db/migrator.js" ]; then
    node dist-db/migrator.js up
  else
    pnpm --filter api migrate up
  fi
  echo "Database migrations applied successfully."
fi

# Run seeders if explicitly requested (default: false)
if [ "${RUN_SEEDS:-false}" = "true" ]; then
  echo "Running database seeders..."
  if [ -f "dist-db/seeder.js" ]; then
    node dist-db/seeder.js up
  else
    pnpm --filter api seed up
  fi
  echo "Database seeders completed."
fi

echo "Executing command: $@"
exec "$@"
