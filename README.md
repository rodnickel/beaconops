# Observabilidade IT

Plataforma de monitoramento e observabilidade para serviços web.

## Stack Tecnológica

- **Backend:** Node.js 20+, TypeScript, Fastify, Prisma
- **Frontend:** Next.js 15, React 19, Tailwind CSS
- **Banco de Dados:** PostgreSQL + Redis
- **Monorepo:** Turborepo + pnpm

## Estrutura do Projeto

```
├── apps/
│   ├── api/          # Backend Fastify
│   └── web/          # Frontend Next.js
├── packages/
│   └── shared/       # Código compartilhado
├── package.json      # Raiz do monorepo
└── turbo.json        # Configuração Turborepo
```

## Requisitos

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+
- Redis 7+

## Instalação

1. Clone o repositório:
```bash
git clone <repo-url>
cd observabilidade-it
```

2. Instale as dependências:
```bash
pnpm install
```

3. Configure as variáveis de ambiente:
```bash
# Backend
cp apps/api/.env.example apps/api/.env
# Edite apps/api/.env com suas configurações

# Frontend
cp apps/web/.env.example apps/web/.env.local
# Edite apps/web/.env.local com suas configurações
```

4. Configure o banco de dados:
```bash
pnpm db:push
```

5. Inicie o desenvolvimento:
```bash
pnpm dev
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

## URLs

- **Frontend:** http://localhost:3000
- **API:** http://localhost:3333
- **API Health:** http://localhost:3333/health
