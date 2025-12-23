import { prisma } from '../../lib/prisma.js'
import {
  scheduleMonitorCheck,
  unscheduleMonitorCheck,
} from '../../workers/monitor-check.worker.js'
import type {
  CreateMonitorInput,
  UpdateMonitorInput,
  ListMonitorsQuery,
  MonitorWithStatus,
} from './monitors.schema.js'

// ============================================
// Serviço de Monitors - CRUD e operações
// ============================================

export async function createMonitor(userId: string, data: CreateMonitorInput) {
  const monitor = await prisma.monitor.create({
    data: {
      ...data,
      userId,
    },
  })

  // Agenda verificação se o monitor estiver ativo
  if (monitor.active) {
    await scheduleMonitorCheck(monitor.id)
  }

  return monitor
}

export async function findAllMonitors(userId: string, query: ListMonitorsQuery) {
  const where: { userId: string; active?: boolean } = { userId }

  if (query.active !== undefined) {
    where.active = query.active === 'true'
  }

  const [monitors, total] = await Promise.all([
    prisma.monitor.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      skip: query.offset,
    }),
    prisma.monitor.count({ where }),
  ])

  return {
    monitors,
    total,
    limit: query.limit,
    offset: query.offset,
  }
}

export async function findMonitorById(userId: string, id: string) {
  const monitor = await prisma.monitor.findFirst({
    where: { id, userId },
  })

  return monitor
}

export async function updateMonitor(
  userId: string,
  id: string,
  data: UpdateMonitorInput
) {
  // Verifica se o monitor pertence ao usuário
  const existing = await prisma.monitor.findFirst({
    where: { id, userId },
  })

  if (!existing) {
    return null
  }

  const monitor = await prisma.monitor.update({
    where: { id },
    data,
  })

  // Atualiza agendamento baseado no status
  if (data.active !== undefined || data.intervalSeconds !== undefined) {
    await unscheduleMonitorCheck(id)
    if (monitor.active) {
      await scheduleMonitorCheck(id)
    }
  }

  return monitor
}

export async function deleteMonitor(userId: string, id: string) {
  // Verifica se o monitor pertence ao usuário
  const existing = await prisma.monitor.findFirst({
    where: { id, userId },
  })

  if (!existing) {
    return false
  }

  // Remove do agendamento
  await unscheduleMonitorCheck(id)

  await prisma.monitor.delete({
    where: { id },
  })

  return true
}

export async function getMonitorWithStatus(
  userId: string,
  id: string
): Promise<MonitorWithStatus | null> {
  const monitor = await prisma.monitor.findFirst({
    where: { id, userId },
    include: {
      checks: {
        orderBy: { checkedAt: 'desc' },
        take: 100, // Últimos 100 checks para calcular uptime
      },
    },
  })

  if (!monitor) {
    return null
  }

  // Calcula o status atual baseado nos últimos checks
  const lastCheck = monitor.checks[0]
  let currentStatus: 'up' | 'down' | 'degraded' | 'unknown' = 'unknown'

  if (lastCheck) {
    if (lastCheck.status === 'up') {
      // Verifica se a latência está degradada (> 2x timeout)
      if (lastCheck.latency && lastCheck.latency > monitor.timeout * 1000) {
        currentStatus = 'degraded'
      } else {
        currentStatus = 'up'
      }
    } else {
      currentStatus = 'down'
    }
  }

  // Calcula uptime percentage
  const totalChecks = monitor.checks.length
  const upChecks = monitor.checks.filter((c) => c.status === 'up').length
  const uptimePercentage = totalChecks > 0 ? (upChecks / totalChecks) * 100 : undefined

  // Remove os checks do retorno para não sobrecarregar
  const { checks, ...monitorData } = monitor

  return {
    ...monitorData,
    currentStatus,
    lastCheck: lastCheck?.checkedAt,
    lastLatency: lastCheck?.latency ?? undefined,
    uptimePercentage,
  }
}

export async function findAllMonitorsWithStatus(
  userId: string,
  query: ListMonitorsQuery
): Promise<{ monitors: MonitorWithStatus[]; total: number; limit: number; offset: number }> {
  const where: { userId: string; active?: boolean } = { userId }

  if (query.active !== undefined) {
    where.active = query.active === 'true'
  }

  const [monitors, total] = await Promise.all([
    prisma.monitor.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      skip: query.offset,
      include: {
        checks: {
          orderBy: { checkedAt: 'desc' },
          take: 100,
        },
      },
    }),
    prisma.monitor.count({ where }),
  ])

  const monitorsWithStatus: MonitorWithStatus[] = monitors.map((monitor) => {
    const lastCheck = monitor.checks[0]
    let currentStatus: 'up' | 'down' | 'degraded' | 'unknown' = 'unknown'

    if (lastCheck) {
      if (lastCheck.status === 'up') {
        if (lastCheck.latency && lastCheck.latency > monitor.timeout * 1000) {
          currentStatus = 'degraded'
        } else {
          currentStatus = 'up'
        }
      } else {
        currentStatus = 'down'
      }
    }

    const totalChecks = monitor.checks.length
    const upChecks = monitor.checks.filter((c) => c.status === 'up').length
    const uptimePercentage = totalChecks > 0 ? (upChecks / totalChecks) * 100 : undefined

    const { checks, ...monitorData } = monitor

    return {
      ...monitorData,
      currentStatus,
      lastCheck: lastCheck?.checkedAt,
      lastLatency: lastCheck?.latency ?? undefined,
      uptimePercentage,
    }
  })

  return {
    monitors: monitorsWithStatus,
    total,
    limit: query.limit,
    offset: query.offset,
  }
}
