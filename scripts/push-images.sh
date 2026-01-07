#!/bin/bash
# ============================================
# Script para build e push das imagens Docker
# ============================================

set -e

# Configuracao - altere conforme necessario
GITHUB_USER="${GITHUB_USER:-seu-usuario}"
VERSION="${VERSION:-latest}"

echo "=== BeaconOps - Build e Push de Imagens ==="
echo "GitHub User: $GITHUB_USER"
echo "Version: $VERSION"
echo ""

# Login no GitHub Container Registry
echo "1. Fazendo login no GitHub Container Registry..."
echo "   Execute: echo \$GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USER --password-stdin"
echo ""

# Build das imagens
echo "2. Buildando imagens..."

echo "   -> API..."
docker build -t ghcr.io/$GITHUB_USER/beaconops-api:$VERSION -f apps/api/Dockerfile .

echo "   -> Web..."
docker build -t ghcr.io/$GITHUB_USER/beaconops-web:$VERSION -f apps/web/Dockerfile .

echo ""
echo "3. Fazendo push das imagens..."

docker push ghcr.io/$GITHUB_USER/beaconops-api:$VERSION
docker push ghcr.io/$GITHUB_USER/beaconops-web:$VERSION

echo ""
echo "=== Imagens publicadas com sucesso! ==="
echo ""
echo "Imagens:"
echo "  - ghcr.io/$GITHUB_USER/beaconops-api:$VERSION"
echo "  - ghcr.io/$GITHUB_USER/beaconops-web:$VERSION"
