#!/bin/sh
set -e

echo "=== BeaconOps API Startup ==="

# Aguarda o PostgreSQL estar disponivel
echo "Aguardando PostgreSQL..."
until nc -z postgres 5432; do
  echo "PostgreSQL ainda nao disponivel, aguardando..."
  sleep 2
done
echo "PostgreSQL disponivel!"

# Sincroniza o schema do banco (idempotente)
echo "Sincronizando schema do banco..."
npx prisma db push --skip-generate || echo "Schema ja sincronizado"

echo "Iniciando aplicacao..."
exec "$@"
