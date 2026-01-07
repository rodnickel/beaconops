import { prisma } from '../../lib/prisma.js'
import type {
  CreateStatusPageInput,
  UpdateStatusPageInput,
  UpdateStatusPageLayoutInput,
  StatusPageWithMonitors,
  PublicStatusPage,
  PublicMonitor,
} from './status-pages.schema.js'

// Include padrão para queries
const statusPageInclude = {
  sections: {
    orderBy: { displayOrder: 'asc' as const },
  },
  monitors: {
    orderBy: { displayOrder: 'asc' as const },
    include: {
      monitor: {
        select: {
          id: true,
          name: true,
          url: true,
          currentStatus: true,
          lastCheck: true,
          lastLatency: true,
        },
      },
    },
  },
}

// ============================================
// Serviço de Status Pages - CRUD e operações
// Atualizado para usar teamId em vez de userId
// ============================================

export async function createStatusPage(
  teamId: string,
  data: CreateStatusPageInput
): Promise<StatusPageWithMonitors> {
  const { monitorIds, ...statusPageData } = data

  const statusPage = await prisma.statusPage.create({
    data: {
      ...statusPageData,
      teamId,
      monitors: monitorIds?.length
        ? {
            create: monitorIds.map((monitorId, index) => ({
              monitorId,
              displayOrder: index,
            })),
          }
        : undefined,
    },
    include: statusPageInclude,
  })

  return statusPage as unknown as StatusPageWithMonitors
}

export async function findAllStatusPages(teamId: string): Promise<StatusPageWithMonitors[]> {
  const statusPages = await prisma.statusPage.findMany({
    where: { teamId },
    orderBy: { createdAt: 'desc' },
    include: statusPageInclude,
  })

  return statusPages as unknown as StatusPageWithMonitors[]
}

export async function findStatusPageById(
  teamId: string,
  id: string
): Promise<StatusPageWithMonitors | null> {
  const statusPage = await prisma.statusPage.findFirst({
    where: { id, teamId },
    include: statusPageInclude,
  })

  return statusPage as unknown as StatusPageWithMonitors | null
}

export async function updateStatusPage(
  teamId: string,
  id: string,
  data: UpdateStatusPageInput
): Promise<StatusPageWithMonitors | null> {
  const existing = await prisma.statusPage.findFirst({
    where: { id, teamId },
  })

  if (!existing) {
    return null
  }

  const { monitorIds, ...statusPageData } = data

  const statusPage = await prisma.statusPage.update({
    where: { id },
    data: statusPageData,
    include: statusPageInclude,
  })

  return statusPage as unknown as StatusPageWithMonitors
}

export async function updateStatusPageLayout(
  teamId: string,
  id: string,
  data: UpdateStatusPageLayoutInput
): Promise<StatusPageWithMonitors | null> {
  const existing = await prisma.statusPage.findFirst({
    where: { id, teamId },
  })

  if (!existing) {
    return null
  }

  // Verifica se todos os monitors pertencem ao time
  const monitorIds = data.monitors.map((m) => m.monitorId)
  const monitors = await prisma.monitor.findMany({
    where: {
      id: { in: monitorIds },
      teamId,
    },
  })

  if (monitors.length !== monitorIds.length) {
    throw new Error('Um ou mais monitors não foram encontrados')
  }

  // Transação para atualizar tudo
  await prisma.$transaction(async (tx) => {
    // 1. Remove todas as seções e monitors existentes
    await tx.statusPageMonitor.deleteMany({
      where: { statusPageId: id },
    })
    await tx.statusPageSection.deleteMany({
      where: { statusPageId: id },
    })

    // 2. Cria as novas seções
    const sectionIdMap = new Map<string, string>() // oldId -> newId

    for (const section of data.sections) {
      const created = await tx.statusPageSection.create({
        data: {
          statusPageId: id,
          name: section.name,
          displayOrder: section.displayOrder,
        },
      })
      // Mapeia o ID temporário (se existir) para o novo ID
      if (section.id) {
        sectionIdMap.set(section.id, created.id)
      }
    }

    // 3. Cria os monitors com referência às seções
    for (const monitor of data.monitors) {
      let sectionId: string | null = null

      if (monitor.sectionId) {
        // Se o sectionId começa com "new-", é um ID temporário do frontend
        // Caso contrário, tenta mapear para o novo ID
        sectionId = sectionIdMap.get(monitor.sectionId) || null
      }

      await tx.statusPageMonitor.create({
        data: {
          statusPageId: id,
          monitorId: monitor.monitorId,
          displayName: monitor.displayName,
          displayOrder: monitor.displayOrder,
          sectionId,
        },
      })
    }
  })

  // Retorna a status page atualizada
  const statusPage = await prisma.statusPage.findFirst({
    where: { id },
    include: statusPageInclude,
  })

  return statusPage as unknown as StatusPageWithMonitors
}

export async function deleteStatusPage(teamId: string, id: string): Promise<boolean> {
  const existing = await prisma.statusPage.findFirst({
    where: { id, teamId },
  })

  if (!existing) {
    return false
  }

  await prisma.statusPage.delete({
    where: { id },
  })

  return true
}

export async function checkSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
  const existing = await prisma.statusPage.findFirst({
    where: {
      slug,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  })

  return !existing
}

// ============================================
// Funções públicas (não requerem autenticação)
// ============================================

async function prepareMonitorData(
  monitor: {
    name: string
    currentStatus: string | null
    lastCheck: Date | null
    lastLatency: number | null
    checks: { status: string; checkedAt: Date }[]
  },
  displayName: string | null,
  statusPage: { showUptime: boolean; showLatency: boolean; showHistory: boolean; historyDays: number }
): Promise<PublicMonitor> {
  // Calcula uptime percentage
  const totalChecks = monitor.checks.length
  const upChecks = monitor.checks.filter((c) => c.status === 'up').length
  const uptimePercentage = totalChecks > 0 ? (upChecks / totalChecks) * 100 : undefined

  // Prepara histórico se habilitado
  let history: { date: string; status: string; uptimePercentage: number }[] | undefined

  if (statusPage.showHistory) {
    const dailyData = new Map<string, { up: number; down: number }>()

    for (let i = 0; i < statusPage.historyDays; i++) {
      const date = new Date()
      date.setDate(date.getDate() - (statusPage.historyDays - 1 - i))
      const dateKey = date.toISOString().split('T')[0]
      dailyData.set(dateKey, { up: 0, down: 0 })
    }

    for (const check of monitor.checks) {
      const dateKey = check.checkedAt.toISOString().split('T')[0]
      const dayData = dailyData.get(dateKey)
      if (dayData) {
        if (check.status === 'up') {
          dayData.up++
        } else {
          dayData.down++
        }
      }
    }

    history = Array.from(dailyData.entries()).map(([date, data]) => {
      const total = data.up + data.down
      const pct = total > 0 ? (data.up / total) * 100 : 0
      let status = 'no_data'
      if (total > 0) {
        if (pct === 100) status = 'up'
        else if (pct === 0) status = 'down'
        else if (pct >= 99) status = 'degraded'
        else status = 'partial'
      }
      return { date, status, uptimePercentage: pct }
    })
  }

  return {
    name: displayName || monitor.name,
    currentStatus: monitor.currentStatus,
    lastCheck: monitor.lastCheck,
    lastLatency: statusPage.showLatency ? monitor.lastLatency : null,
    uptimePercentage: statusPage.showUptime ? uptimePercentage : undefined,
    history,
  }
}

export async function getPublicStatusPage(slug: string): Promise<PublicStatusPage | null> {
  const statusPage = await prisma.statusPage.findFirst({
    where: {
      slug,
      isPublic: true,
    },
    include: {
      sections: {
        orderBy: { displayOrder: 'asc' },
      },
      monitors: {
        orderBy: { displayOrder: 'asc' },
        include: {
          monitor: {
            include: {
              checks: {
                orderBy: { checkedAt: 'desc' },
                take: 100,
              },
            },
          },
        },
      },
    },
  })

  if (!statusPage) {
    return null
  }

  // Agrupa monitors por seção
  const monitorsBySection = new Map<string | null, typeof statusPage.monitors>()

  for (const spm of statusPage.monitors) {
    const sectionId = spm.sectionId
    if (!monitorsBySection.has(sectionId)) {
      monitorsBySection.set(sectionId, [])
    }
    monitorsBySection.get(sectionId)!.push(spm)
  }

  // Prepara seções com seus monitors
  const sections = await Promise.all(
    statusPage.sections.map(async (section) => {
      const sectionMonitors = monitorsBySection.get(section.id) || []
      const monitors = await Promise.all(
        sectionMonitors.map((spm) =>
          prepareMonitorData(spm.monitor, spm.displayName, statusPage)
        )
      )

      return {
        id: section.id,
        name: section.name,
        displayOrder: section.displayOrder,
        monitors,
      }
    })
  )

  // Prepara monitors sem seção
  const unsectionedMonitors = monitorsBySection.get(null) || []
  const monitors = await Promise.all(
    unsectionedMonitors.map((spm) =>
      prepareMonitorData(spm.monitor, spm.displayName, statusPage)
    )
  )

  return {
    slug: statusPage.slug,
    name: statusPage.name,
    description: statusPage.description,
    logoUrl: statusPage.logoUrl,
    faviconUrl: statusPage.faviconUrl,
    primaryColor: statusPage.primaryColor,
    backgroundColor: statusPage.backgroundColor,
    showUptime: statusPage.showUptime,
    showLatency: statusPage.showLatency,
    showHistory: statusPage.showHistory,
    historyDays: statusPage.historyDays,
    sections,
    monitors,
  }
}
