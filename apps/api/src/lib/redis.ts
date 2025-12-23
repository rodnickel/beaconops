import Redis from 'ioredis'
import { env } from '../config/env.js'

// Cria conexão com o Redis
// Usado para cache e filas de jobs (BullMQ)

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null, // Necessário para o BullMQ
  enableReadyCheck: false,
})

// Loga eventos de conexão
redis.on('connect', () => {
  console.log('✅ Conectado ao Redis')
})

redis.on('error', (err) => {
  console.error('❌ Erro na conexão com Redis:', err.message)
})
