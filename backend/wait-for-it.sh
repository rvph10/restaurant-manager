#!/bin/sh

# Exit on any error
set -e

echo "🔍 Checking for required services..."

# Wait for PostgreSQL
until pg_isready -h postgres -p 5432 -U postgres; do
  echo "⏳ PostgreSQL is unavailable - sleeping"
  sleep 1
done
echo "✅ PostgreSQL is ready!"

# Wait for Redis
until nc -z redis 6379; do
  echo "⏳ Redis is unavailable - sleeping"
  sleep 1
done
echo "✅ Redis is ready!"

echo "🔄 Running database migrations..."
npx prisma migrate deploy --schema=./src/prisma/schema.prisma

echo "🔄 Generating Prisma client..."
npx prisma generate --schema=./src/prisma/schema.prisma

echo "🌱 Seeding database..."
npm run db:seed

echo "🚀 Starting application..."
exec "$@"