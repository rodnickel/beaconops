\# 📋 Project Brief: Plataforma de Monitoramento e Observabilidade



\## 🎯 Visão Geral



Estou desenvolvendo uma plataforma de monitoramento e observabilidade similar ao Better Stack. O objetivo é criar uma solução completa que inicialmente será usada internamente na minha empresa, mas com potencial de se tornar um produto comercial (SaaS).



\*\*Nível técnico do desenvolvedor:\*\* Iniciante/Intermediário — preciso de explicações claras e código bem comentado.



---



\## 🛠️ Stack Tecnológica Definida



\### Backend

\- \*\*Runtime:\*\* Node.js 20+ com TypeScript

\- \*\*Framework:\*\* Fastify

\- \*\*ORM:\*\* Prisma

\- \*\*Validação:\*\* Zod

\- \*\*Autenticação:\*\* JWT + bcrypt



\### Banco de Dados

\- \*\*Principal:\*\* PostgreSQL

\- \*\*Cache/Filas:\*\* Redis (para agendamento de jobs)

\- \*\*Job Queue:\*\* BullMQ (baseado em Redis)



\### Frontend

\- \*\*Framework:\*\* Next.js 14 (App Router)

\- \*\*Linguagem:\*\* TypeScript

\- \*\*Estilização:\*\* Tailwind CSS

\- \*\*Componentes:\*\* shadcn/ui

\- \*\*Gráficos:\*\* Recharts

\- \*\*Estado:\*\* Zustand (se necessário)



\### Infraestrutura

\- \*\*Backend + DB:\*\* Railway ou Render

\- \*\*Frontend:\*\* Vercel

\- \*\*Emails:\*\* Resend

\- \*\*DNS (futuro):\*\* Cloudflare



---



\## 🏗️ Arquitetura do Projeto



```

projeto/

├── apps/

│   ├── api/                 # Backend Fastify

│   │   ├── src/

│   │   │   ├── modules/     # Módulos por domínio

│   │   │   │   ├── auth/

│   │   │   │   ├── monitors/

│   │   │   │   ├── alerts/

│   │   │   │   ├── incidents/

│   │   │   │   └── status-pages/

│   │   │   ├── jobs/        # Workers de verificação

│   │   │   ├── lib/         # Utilitários

│   │   │   ├── config/      # Configurações

│   │   │   └── server.ts    # Entry point

│   │   ├── prisma/

│   │   │   └── schema.prisma

│   │   └── package.json

│   │

│   └── web/                 # Frontend Next.js

│       ├── src/

│       │   ├── app/         # App Router pages

│       │   ├── components/  # Componentes React

│       │   ├── lib/         # Utilitários

│       │   └── hooks/       # Custom hooks

│       └── package.json

│

├── packages/                # Código compartilhado (futuro)

│   └── shared/

│

├── package.json             # Monorepo root

├── turbo.json               # Turborepo config

└── README.md

```



---



\## 📦 Funcionalidades por Fase



\### Fase 1: MVP — Uptime Monitoring (COMEÇAR AQUI)



\#### 1.1 Autenticação

\- \[ ] Registro de usuário (email + senha)

\- \[ ] Login com JWT

\- \[ ] Logout

\- \[ ] Recuperação de senha (email)



\#### 1.2 Monitors (Verificação de Uptime)

\- \[ ] CRUD de monitors (criar, listar, editar, deletar)

\- \[ ] Tipos de verificação: HTTP/HTTPS

\- \[ ] Configurar intervalo de verificação (1min, 5min, 10min, 30min)

\- \[ ] Verificar status code esperado

\- \[ ] Verificar tempo de resposta (timeout)

\- \[ ] Verificar texto presente na resposta (opcional)

\- \[ ] Histórico de verificações (últimas 24h, 7 dias, 30 dias)

\- \[ ] Cálculo de uptime percentage



\#### 1.3 Worker de Verificação

\- \[ ] Job que roda em background

\- \[ ] Executa verificações no intervalo configurado

\- \[ ] Salva resultado no banco (status, latência, timestamp)

\- \[ ] Detecta mudança de estado (up → down, down → up)

\- \[ ] Dispara alerta quando estado muda



\#### 1.4 Sistema de Alertas

\- \[ ] Configurar canais de notificação por monitor

\- \[ ] Alerta por email (Resend)

\- \[ ] Alerta por webhook (para integrar com Slack, Discord, etc)

\- \[ ] Cooldown entre alertas (evitar spam)



\#### 1.5 Dashboard

\- \[ ] Lista de monitors com status atual

\- \[ ] Indicador visual (verde/vermelho/amarelo)

\- \[ ] Gráfico de latência (últimas 24h)

\- \[ ] Gráfico de uptime (últimos 7 dias)

\- \[ ] Filtros e busca



\### Fase 2: Status Pages

\- \[ ] Criar página de status pública

\- \[ ] Subdomínio ou path customizado

\- \[ ] Selecionar quais monitors mostrar

\- \[ ] Histórico de incidentes público

\- \[ ] Permitir inscrição para notificações

\- \[ ] Customização visual (logo, cores)



\### Fase 3: Incident Management

\- \[ ] Criar incidentes manualmente

\- \[ ] Incidentes automáticos quando monitor cai

\- \[ ] Timeline do incidente

\- \[ ] Atualizações de status (investigating, identified, fixed)

\- \[ ] Postmortem



\### Fase 4: Logs (Futuro)

\- \[ ] API de ingestão de logs

\- \[ ] Busca e filtros

\- \[ ] Alertas baseados em padrões



\### Fase 5: Multi-tenancy e Comercialização

\- \[ ] Organizações/Workspaces

\- \[ ] Múltiplos usuários por organização

\- \[ ] Planos e limites

\- \[ ] Billing (Stripe)



---



\## 🗄️ Modelos de Dados (Prisma Schema Inicial)



```prisma

generator client {

&nbsp; provider = "prisma-client-js"

}



datasource db {

&nbsp; provider = "postgresql"

&nbsp; url      = env("DATABASE\_URL")

}



model User {

&nbsp; id            String    @id @default(cuid())

&nbsp; email         String    @unique

&nbsp; name          String?

&nbsp; passwordHash  String

&nbsp; createdAt     DateTime  @default(now())

&nbsp; updatedAt     DateTime  @updatedAt

&nbsp; 

&nbsp; monitors      Monitor\[]

&nbsp; alertChannels AlertChannel\[]

}



model Monitor {

&nbsp; id              String        @id @default(cuid())

&nbsp; name            String

&nbsp; url             String

&nbsp; method          String        @default("GET")

&nbsp; intervalSeconds Int           @default(300)  // 5 minutos

&nbsp; timeout         Int           @default(30)   // segundos

&nbsp; expectedStatus  Int           @default(200)

&nbsp; checkSsl        Boolean       @default(true)

&nbsp; active          Boolean       @default(true)

&nbsp; 

&nbsp; createdAt       DateTime      @default(now())

&nbsp; updatedAt       DateTime      @updatedAt

&nbsp; 

&nbsp; userId          String

&nbsp; user            User          @relation(fields: \[userId], references: \[id])

&nbsp; 

&nbsp; checks          Check\[]

&nbsp; alerts          Alert\[]

&nbsp; 

&nbsp; @@index(\[userId])

&nbsp; @@index(\[active])

}



model Check {

&nbsp; id          String   @id @default(cuid())

&nbsp; status      String   // "up" | "down" | "degraded"

&nbsp; statusCode  Int?

&nbsp; latency     Int?     // ms

&nbsp; error       String?

&nbsp; checkedAt   DateTime @default(now())

&nbsp; 

&nbsp; monitorId   String

&nbsp; monitor     Monitor  @relation(fields: \[monitorId], references: \[id], onDelete: Cascade)

&nbsp; 

&nbsp; @@index(\[monitorId, checkedAt])

}



model AlertChannel {

&nbsp; id        String   @id @default(cuid())

&nbsp; type      String   // "email" | "webhook" | "slack"

&nbsp; name      String

&nbsp; config    Json     // { email: "..." } ou { webhookUrl: "..." }

&nbsp; active    Boolean  @default(true)

&nbsp; 

&nbsp; createdAt DateTime @default(now())

&nbsp; updatedAt DateTime @updatedAt

&nbsp; 

&nbsp; userId    String

&nbsp; user      User     @relation(fields: \[userId], references: \[id])

&nbsp; 

&nbsp; alerts    Alert\[]

&nbsp; 

&nbsp; @@index(\[userId])

}



model Alert {

&nbsp; id              String       @id @default(cuid())

&nbsp; type            String       // "down" | "up" | "degraded"

&nbsp; message         String

&nbsp; sentAt          DateTime     @default(now())

&nbsp; 

&nbsp; monitorId       String

&nbsp; monitor         Monitor      @relation(fields: \[monitorId], references: \[id], onDelete: Cascade)

&nbsp; 

&nbsp; alertChannelId  String

&nbsp; alertChannel    AlertChannel @relation(fields: \[alertChannelId], references: \[id])

&nbsp; 

&nbsp; @@index(\[monitorId, sentAt])

}



model Incident {

&nbsp; id          String   @id @default(cuid())

&nbsp; title       String

&nbsp; status      String   // "investigating" | "identified" | "monitoring" | "resolved"

&nbsp; severity    String   // "minor" | "major" | "critical"

&nbsp; startedAt   DateTime @default(now())

&nbsp; resolvedAt  DateTime?

&nbsp; 

&nbsp; createdAt   DateTime @default(now())

&nbsp; updatedAt   DateTime @updatedAt

&nbsp; 

&nbsp; updates     IncidentUpdate\[]

}



model IncidentUpdate {

&nbsp; id          String   @id @default(cuid())

&nbsp; message     String

&nbsp; status      String

&nbsp; createdAt   DateTime @default(now())

&nbsp; 

&nbsp; incidentId  String

&nbsp; incident    Incident @relation(fields: \[incidentId], references: \[id], onDelete: Cascade)

&nbsp; 

&nbsp; @@index(\[incidentId])

}

```



---



\## 🔌 Endpoints da API (Fase 1)



\### Auth

```

POST   /auth/register     - Criar conta

POST   /auth/login        - Login (retorna JWT)

POST   /auth/logout       - Logout

POST   /auth/forgot       - Solicitar reset de senha

POST   /auth/reset        - Resetar senha

GET    /auth/me           - Dados do usuário logado

```



\### Monitors

```

GET    /monitors          - Listar monitors do usuário

POST   /monitors          - Criar monitor

GET    /monitors/:id      - Detalhes do monitor

PUT    /monitors/:id      - Atualizar monitor

DELETE /monitors/:id      - Deletar monitor

GET    /monitors/:id/checks - Histórico de verificações

POST   /monitors/:id/test   - Testar monitor manualmente

```



\### Alert Channels

```

GET    /alert-channels        - Listar canais

POST   /alert-channels        - Criar canal

PUT    /alert-channels/:id    - Atualizar canal

DELETE /alert-channels/:id    - Deletar canal

POST   /alert-channels/:id/test - Testar canal

```



\### Dashboard

```

GET    /dashboard/summary     - Resumo (total monitors, up, down, uptime médio)

GET    /dashboard/timeline    - Timeline de eventos recentes

```



---



\## ⚙️ Variáveis de Ambiente



```env

\# Database

DATABASE\_URL="postgresql://user:pass@localhost:5432/monitoring"



\# Redis

REDIS\_URL="redis://localhost:6379"



\# JWT

JWT\_SECRET="sua-chave-secreta-muito-segura"

JWT\_EXPIRES\_IN="7d"



\# Email (Resend)

RESEND\_API\_KEY="re\_xxxx"

EMAIL\_FROM="alerts@seudominio.com"



\# App

NODE\_ENV="development"

API\_PORT=3333

WEB\_URL="http://localhost:3000"

API\_URL="http://localhost:3333"

```



---



\## 📝 Instruções para o Claude



1\. \*\*Sempre use TypeScript\*\* com tipagem estrita

2\. \*\*Comente o código\*\* explicando a lógica principal

3\. \*\*Siga o padrão de pastas\*\* definido na arquitetura

4\. \*\*Use tratamento de erros\*\* adequado com try/catch

5\. \*\*Valide inputs\*\* com Zod em todos os endpoints

6\. \*\*Crie testes\*\* pelo menos para a lógica de negócio principal

7\. \*\*Use variáveis de ambiente\*\* para configurações sensíveis

8\. \*\*Siga RESTful\*\* nos endpoints da API

9\. \*\*Documente\*\* cada módulo com um README se necessário



---



\## 🚀 Próximos Passos Imediatos



1\. Inicializar monorepo com Turborepo

2\. Configurar projeto do backend (Fastify + TypeScript + Prisma)

3\. Configurar projeto do frontend (Next.js + Tailwind + shadcn)

4\. Implementar autenticação

5\. Implementar CRUD de monitors

6\. Implementar worker de verificação

7\. Implementar dashboard básico



---



\## 🤝 Como Trabalhar



Vou desenvolver feature por feature. A cada etapa:

1\. Me mostre o código completo dos arquivos

2\. Explique o que cada parte faz

3\. Me diga como testar

4\. Só passe para próxima feature quando eu confirmar que funcionou



\*\*Estou pronto para começar. Inicie pela configuração do monorepo e setup inicial do projeto.\*\*

