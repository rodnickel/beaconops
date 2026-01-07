import { Worker, Queue } from 'bullmq'
import { redis } from '../lib/redis.js'
import { prisma } from '../lib/prisma.js'
import { findActiveChannelsByTeamId, createAlert } from '../modules/alerts/alerts.service.js'
import { sendNotification } from '../services/notification.service.js'

// ============================================
// Worker de Verificação de Monitors
// ============================================

const QUEUE_NAME = 'monitor-checks'

// Fila para agendar verificações
export const monitorCheckQueue = new Queue(QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: 100, // Mantém últimos 100 jobs completos
    removeOnFail: 50,      // Mantém últimos 50 jobs com falha
  },
})

interface CheckJobData {
  monitorId: string
}

interface CheckResult {
  status: 'up' | 'down'
  statusCode: number | null
  latency: number | null
  error: string | null
}

async function performCheck(
  url: string,
  method: string,
  timeout: number,
  expectedStatus: number,
  checkSsl: boolean
): Promise<CheckResult> {
  const startTime = Date.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout * 1000)

    const response = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        'User-Agent': 'BeaconOps-Monitor/1.0',
      },
    })

    clearTimeout(timeoutId)

    const latency = Date.now() - startTime
    const statusCode = response.status
    const isUp = statusCode === expectedStatus

    return {
      status: isUp ? 'up' : 'down',
      statusCode,
      latency,
      error: isUp ? null : `Status code ${statusCode} (esperado: ${expectedStatus})`,
    }
  } catch (err) {
    const latency = Date.now() - startTime
    let errorMsg = 'Erro desconhecido'

    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        errorMsg = `Timeout após ${timeout}s`
      } else {
        errorMsg = err.message
      }
    }

    return {
      status: 'down',
      statusCode: null,
      latency,
      error: errorMsg,
    }
  }
}

async function processMonitorCheck(monitorId: string) {
  // Busca o monitor
  const monitor = await prisma.monitor.findUnique({
    where: { id: monitorId },
  })

  if (!monitor) {
    console.log(`Monitor ${monitorId} não encontrado, pulando...`)
    return
  }

  if (!monitor.active) {
    console.log(`Monitor ${monitor.name} está inativo, pulando...`)
    return
  }

  console.log(`🔍 Verificando: ${monitor.name} (${monitor.url})`)

  // Realiza a verificação
  const result = await performCheck(
    monitor.url,
    monitor.method,
    monitor.timeout,
    monitor.expectedStatus,
    monitor.checkSsl
  )

  // Salva o resultado no banco
  await prisma.check.create({
    data: {
      monitorId: monitor.id,
      status: result.status,
      statusCode: result.statusCode,
      latency: result.latency,
      error: result.error,
    },
  })

  console.log(
    `   ${result.status === 'up' ? '✅' : '❌'} ${monitor.name}: ${result.status} (${result.latency}ms)`
  )

  // Verifica se precisa disparar alerta (status mudou)
  const previousStatus = monitor.currentStatus
  const statusChanged = previousStatus !== null && previousStatus !== result.status
  // Também dispara alerta se é a primeira verificação e status é down
  const isFirstCheckDown = previousStatus === null && result.status === 'down'

  // Atualiza o status atual do monitor
  await prisma.monitor.update({
    where: { id: monitor.id },
    data: {
      currentStatus: result.status,
      lastCheck: new Date(),
      lastLatency: result.latency,
    },
  })

  // Se o status mudou e alertas estão habilitados, dispara alertas
  if ((statusChanged || isFirstCheckDown) && monitor.alertsEnabled) {
    console.log(`🔔 Status mudou: ${previousStatus ?? 'unknown'} → ${result.status} para ${monitor.name}`)
    await triggerAlerts(monitor, previousStatus ?? 'unknown', result.status, result.error)
  } else if ((statusChanged || isFirstCheckDown) && !monitor.alertsEnabled) {
    console.log(`🔕 Status mudou mas alertas desabilitados para ${monitor.name}`)
  }
}

// Função para disparar alertas quando o status muda
async function triggerAlerts(
  monitor: { id: string; name: string; url: string; teamId: string },
  previousStatus: string,
  newStatus: string,
  errorMessage: string | null
) {
  try {
    // Busca os canais de alerta ativos do time
    const channels = await findActiveChannelsByTeamId(monitor.teamId)

    if (channels.length === 0) {
      console.log(`   Nenhum canal de alerta configurado para o time`)
      return
    }

    // Monta a mensagem do alerta
    const alertMessage = newStatus === 'down'
      ? `Monitor "${monitor.name}" está offline: ${errorMessage || 'Falha na verificação'}`
      : `Monitor "${monitor.name}" voltou a ficar online`

    // Envia notificações para cada canal e registra o alerta
    for (const channel of channels) {
      try {
        // Cria o alerta no banco para este canal
        const alert = await createAlert(
          monitor.id,
          channel.id,
          newStatus as 'up' | 'down' | 'degraded',
          alertMessage
        )
        console.log(`   Alerta criado: ${alert.id}`)

        // Envia a notificação
        await sendNotification(
          channel.type as 'email' | 'webhook' | 'slack',
          channel.config as Record<string, string>,
          {
            monitorName: monitor.name,
            monitorUrl: monitor.url,
            status: newStatus as 'up' | 'down' | 'degraded',
            message: alertMessage,
            checkedAt: new Date(),
          }
        )
        console.log(`   ✅ Notificação enviada via ${channel.type}: ${channel.name}`)
      } catch (err) {
        console.error(`   ❌ Erro ao enviar notificação via ${channel.type}:`, err)
      }
    }
  } catch (err) {
    console.error('Erro ao disparar alertas:', err)
  }
}

// Cria o worker
export const monitorCheckWorker = new Worker<CheckJobData>(
  QUEUE_NAME,
  async (job) => {
    await processMonitorCheck(job.data.monitorId)
  },
  {
    connection: redis,
    concurrency: 10, // Processa até 10 verificações em paralelo
  }
)

monitorCheckWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`)
})

monitorCheckWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message)
})

// Função para agendar verificações de todos os monitores ativos
export async function scheduleAllMonitorChecks() {
  const monitors = await prisma.monitor.findMany({
    where: { active: true },
  })

  console.log(`📋 Agendando verificações para ${monitors.length} monitores...`)

  for (const monitor of monitors) {
    // Agenda verificação recorrente
    await monitorCheckQueue.add(
      `check-${monitor.id}`,
      { monitorId: monitor.id },
      {
        repeat: {
          every: monitor.intervalSeconds * 1000,
        },
        jobId: `repeat-${monitor.id}`,
      }
    )
  }

  console.log('✅ Verificações agendadas!')
}

// Função para adicionar um monitor ao agendamento
export async function scheduleMonitorCheck(monitorId: string) {
  const monitor = await prisma.monitor.findUnique({
    where: { id: monitorId },
  })

  if (!monitor || !monitor.active) {
    return
  }

  await monitorCheckQueue.add(
    `check-${monitor.id}`,
    { monitorId: monitor.id },
    {
      repeat: {
        every: monitor.intervalSeconds * 1000,
      },
      jobId: `repeat-${monitor.id}`,
    }
  )
}

// Função para remover um monitor do agendamento
export async function unscheduleMonitorCheck(monitorId: string) {
  const repeatableJobs = await monitorCheckQueue.getRepeatableJobs()
  const job = repeatableJobs.find((j) => j.id === `repeat-${monitorId}`)

  if (job) {
    await monitorCheckQueue.removeRepeatableByKey(job.key)
  }
}
