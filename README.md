# Taco - Trust Assured Connectivity Observer

Plataforma de monitoramento e observabilidade para garantir a disponibilidade dos seus serviços.

## Recursos

- **Monitoramento HTTP/HTTPS** - Verificações automáticas com intervalos configuráveis (30s a 1h)
- **Alertas Multi-canal** - Notificações via Email, WhatsApp, Telegram e Webhook
- **Páginas de Status** - Páginas públicas personalizáveis para comunicar status aos usuários
- **Grupos de Monitores** - Organize monitores em grupos lógicos
- **Gestão de Incidentes** - Rastreie, reconheça e resolva incidentes automaticamente
- **Verificação SSL** - Alertas proativos de expiração de certificados
- **Times e Colaboração** - Gerencie equipes com diferentes níveis de acesso

## Stack Tecnológica

- **Backend:** Node.js 20+, TypeScript, Fastify, Prisma, BullMQ
- **Frontend:** Next.js 15, React 19, Tailwind CSS
- **Banco de Dados:** PostgreSQL 16 + Redis 7
- **Monorepo:** Turborepo + pnpm
- **Containerização:** Docker + Docker Compose

## Estrutura do Projeto

```
├── apps/
│   ├── api/              # Backend Fastify
│   │   ├── src/
│   │   │   ├── lib/      # Configurações (prisma, redis)
│   │   │   ├── modules/  # Módulos da API
│   │   │   │   ├── alerts/
│   │   │   │   ├── auth/
│   │   │   │   ├── groups/
│   │   │   │   ├── incidents/
│   │   │   │   ├── monitors/
│   │   │   │   ├── status-pages/
│   │   │   │   └── teams/
│   │   │   └── workers/  # Workers BullMQ
│   │   └── prisma/       # Schema do banco
│   └── web/              # Frontend Next.js
│       └── src/
│           ├── app/      # App Router
│           ├── components/
│           └── lib/      # API client
├── docker-compose.yml           # Desenvolvimento local
├── docker-compose.prod.yml      # Produção standalone
└── docker-compose.portainer.yml # Deploy via Portainer/Swarm
```

## Requisitos

- Node.js 20+
- pnpm 9+
- PostgreSQL 16+
- Redis 7+
- Docker (opcional, para deploy)

## Instalação Local

1. Clone o repositório:
```bash
git clone https://github.com/rodnickel/taco.git
cd taco
```

2. Instale as dependências:
```bash
pnpm install
```

3. Configure as variáveis de ambiente:
```bash
# Backend
cp apps/api/.env.example apps/api/.env

# Frontend
cp apps/web/.env.example apps/web/.env.local
```

4. Edite `apps/api/.env`:
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/taco
REDIS_URL=redis://localhost:6379
JWT_SECRET=seu-secret-seguro
PORT=3333
```

5. Edite `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3333
```

6. Configure o banco de dados:
```bash
pnpm db:push
```

7. Inicie o desenvolvimento:
```bash
pnpm dev
```

## Deploy com Docker

### Docker Compose (Standalone)

```bash
# Build das imagens
docker compose -f docker-compose.prod.yml build

# Iniciar
docker compose -f docker-compose.prod.yml up -d
```

### Portainer + Docker Swarm

1. Configure as variáveis no Portainer:
   - `DOMAIN`: seu domínio (ex: taco.exemplo.com)
   - `JWT_SECRET`: chave secreta para JWT
   - `POSTGRES_PASSWORD`: senha do PostgreSQL

2. Use o arquivo `docker-compose.portainer.yml` como stack

### Build e Push para GHCR

```bash
# Login no GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Build da API
docker build -t ghcr.io/rodnickel/taco-api:latest -f apps/api/Dockerfile .
docker push ghcr.io/rodnickel/taco-api:latest

# Build do Web
docker build -t ghcr.io/rodnickel/taco-web:latest -f apps/web/Dockerfile .
docker push ghcr.io/rodnickel/taco-web:latest
```

## Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Inicia todos os apps em modo desenvolvimento |
| `pnpm build` | Build de produção |
| `pnpm lint` | Executa linting |
| `pnpm test` | Executa testes |
| `pnpm db:push` | Sincroniza schema Prisma com o banco |
| `pnpm db:migrate` | Executa migrations |
| `pnpm db:studio` | Abre Prisma Studio |

## API Endpoints

### Autenticação
- `POST /auth/register` - Criar conta
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `GET /auth/me` - Usuário atual

### Monitors
- `GET /monitors` - Listar monitores
- `POST /monitors` - Criar monitor
- `GET /monitors/:id` - Detalhes do monitor
- `PUT /monitors/:id` - Atualizar monitor
- `DELETE /monitors/:id` - Deletar monitor
- `GET /monitors/:id/history` - Histórico de uptime
- `GET /monitors/:id/ssl` - Informações SSL

### Grupos
- `GET /groups` - Listar grupos
- `POST /groups` - Criar grupo
- `GET /groups/:id` - Detalhes do grupo
- `PUT /groups/:id` - Atualizar grupo
- `DELETE /groups/:id` - Deletar grupo
- `POST /groups/:id/monitors` - Adicionar monitores
- `DELETE /groups/:id/monitors` - Remover monitores

### Incidentes
- `GET /incidents` - Listar incidentes
- `GET /incidents/:id` - Detalhes do incidente
- `POST /incidents/:id/acknowledge` - Reconhecer incidente
- `POST /incidents/:id/resolve` - Resolver incidente

### Canais de Alerta
- `GET /alerts/channels` - Listar canais
- `POST /alerts/channels` - Criar canal
- `PUT /alerts/channels/:id` - Atualizar canal
- `DELETE /alerts/channels/:id` - Deletar canal
- `POST /alerts/channels/:id/test` - Testar canal

### Status Pages
- `GET /status-pages` - Listar páginas
- `POST /status-pages` - Criar página
- `GET /status-pages/:id` - Detalhes da página
- `PUT /status-pages/:id` - Atualizar página
- `DELETE /status-pages/:id` - Deletar página
- `GET /public/status/:slug` - Página pública

### Times
- `GET /teams` - Listar times
- `POST /teams` - Criar time
- `GET /teams/:id` - Detalhes do time
- `PUT /teams/:id` - Atualizar time
- `DELETE /teams/:id` - Deletar time

## URLs de Desenvolvimento

- **Frontend:** http://localhost:3000
- **API:** http://localhost:3333
- **Health Check:** http://localhost:3333/health

## Configuração de Alertas

### WhatsApp (Evolution API)
```json
{
  "baseUrl": "https://sua-evolution-api.com",
  "apiKey": "sua-api-key",
  "instance": "nome-da-instancia",
  "phone": "5511999999999"
}
```

### Email (SMTP)
```json
{
  "email": "destinatario@exemplo.com",
  "smtpHost": "smtp.exemplo.com",
  "smtpPort": "587",
  "smtpUser": "usuario",
  "smtpPass": "senha"
}
```

### Telegram
```json
{
  "botToken": "123456:ABC-DEF...",
  "chatId": "-1001234567890"
}
```

### Webhook
```json
{
  "url": "https://seu-webhook.com/endpoint"
}
```

## Licença

MIT
