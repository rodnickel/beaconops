import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { env } from './config/env.js'
import { prisma } from './lib/prisma.js'
import { registerAuthDecorator } from './lib/auth.js'
import { authRoutes } from './modules/auth/auth.routes.js'
import { monitorsRoutes } from './modules/monitors/monitors.routes.js'
import { alertsRoutes } from './modules/alerts/alerts.routes.js'

// Cria a instância do Fastify com logger habilitado
const app = Fastify({
  logger: {
    level: env.NODE_ENV === 'development' ? 'info' : 'warn',
    transport:
      env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
            },
          }
        : undefined,
  },
})

// Registra plugins
async function registerPlugins() {
  // CORS - permite requisições do frontend
  await app.register(cors, {
    origin: true, // Aceita qualquer origem em desenvolvimento
    credentials: true,
  })

  // JWT - autenticação
  await app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  })

  // Registra o decorator de autenticação
  await registerAuthDecorator(app)
}

// Registra as rotas
async function registerRoutes() {
  // Rotas de autenticação: /auth/*
  await app.register(authRoutes, { prefix: '/auth' })

  // Rotas de monitors: /monitors/*
  await app.register(monitorsRoutes, { prefix: '/monitors' })

  // Rotas de alerts: /alerts/*
  await app.register(alertsRoutes, { prefix: '/alerts' })
}

// Rota de health check
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})

// Rota raiz
app.get('/', async () => {
  return {
    name: 'Observabilidade API',
    version: '0.1.0',
    docs: '/docs',
  }
})

// Função para iniciar o servidor
async function start() {
  try {
    // Registra plugins
    await registerPlugins()

    // Registra rotas
    await registerRoutes()

    // Testa conexão com o banco de dados
    await prisma.$connect()
    console.log('✅ Conectado ao PostgreSQL')

    // Inicia o servidor
    await app.listen({
      port: env.API_PORT,
      host: '0.0.0.0',
    })

    console.log(`🚀 Servidor rodando em ${env.API_URL}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

// Graceful shutdown
async function shutdown() {
  console.log('\n🔄 Encerrando servidor...')

  await app.close()
  await prisma.$disconnect()

  console.log('✅ Servidor encerrado com sucesso')
  process.exit(0)
}

// Captura sinais de encerramento
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

// Inicia a aplicação
start()
