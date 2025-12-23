#!/bin/bash

# ============================================
# Script de Deploy - Observabilidade IT
# ============================================

set -e

echo "🚀 Iniciando deploy da Observabilidade IT..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Verificar se .env existe
if [ ! -f .env ]; then
    error "❌ Arquivo .env não encontrado!"
    echo "Copie o arquivo .env.example para .env e configure as variáveis"
    echo "  cp .env.example .env"
    echo "  nano .env"
    exit 1
fi

log "✅ Arquivo .env encontrado"

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    error "❌ Docker não está instalado!"
    echo "Instale o Docker: https://docs.docker.com/engine/install/"
    exit 1
fi

log "✅ Docker encontrado"

# Verificar se Docker Compose está disponível
if ! docker compose version &> /dev/null; then
    error "❌ Docker Compose não está disponível!"
    echo "Docker Compose V2 é necessário"
    exit 1
fi

log "✅ Docker Compose encontrado"

# Parar containers existentes (se houver)
log "🛑 Parando containers existentes..."
docker compose -f docker-compose.prod.yml down 2>/dev/null || true

# Fazer pull das imagens base
log "📥 Baixando imagens base..."
docker compose -f docker-compose.prod.yml pull postgres redis 2>/dev/null || true

# Build das imagens
log "🔨 Construindo imagens..."
docker compose -f docker-compose.prod.yml build --no-cache

# Subir o banco primeiro
log "🗄️ Iniciando PostgreSQL e Redis..."
docker compose -f docker-compose.prod.yml up -d postgres redis

# Aguardar banco ficar pronto
log "⏳ Aguardando PostgreSQL inicializar..."
sleep 10

# Verificar se o banco está respondendo
until docker compose -f docker-compose.prod.yml exec -T postgres pg_isready -U observabilidade; do
    warn "⏳ Aguardando PostgreSQL..."
    sleep 2
done

log "✅ PostgreSQL está pronto!"

# Rodar migrations
log "🔄 Executando migrations do Prisma..."
docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy

# Subir todos os serviços
log "🚀 Iniciando todos os serviços..."
docker compose -f docker-compose.prod.yml up -d

# Aguardar serviços ficarem saudáveis
log "⏳ Aguardando serviços ficarem saudáveis..."
sleep 15

# Verificar status
log "📊 Status dos serviços:"
docker compose -f docker-compose.prod.yml ps

# Verificar logs da API
log "📋 Últimos logs da API:"
docker compose -f docker-compose.prod.yml logs --tail=20 api

echo ""
echo "============================================"
echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"
echo "============================================"
echo ""
echo "📍 Acesse a aplicação em: http://localhost (ou seu domínio)"
echo "📍 API disponível em: http://localhost/api"
echo ""
echo "📊 Comandos úteis:"
echo "  - Ver logs:     docker compose -f docker-compose.prod.yml logs -f"
echo "  - Ver status:   docker compose -f docker-compose.prod.yml ps"
echo "  - Parar tudo:   docker compose -f docker-compose.prod.yml down"
echo "  - Reiniciar:    docker compose -f docker-compose.prod.yml restart"
echo ""
