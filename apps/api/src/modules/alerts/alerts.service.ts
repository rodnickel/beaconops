import { prisma } from '../../lib/prisma.js'
import type {
  CreateAlertChannelInput,
  UpdateAlertChannelInput,
  ListAlertChannelsQuery,
  AlertChannelConfig,
} from './alerts.schema.js'

// ============================================
// Serviço de Alert Channels - CRUD
// ============================================

export async function createAlertChannel(userId: string, data: CreateAlertChannelInput) {
  const channel = await prisma.alertChannel.create({
    data: {
      name: data.name,
      type: data.type,
      config: data.config as object,
      active: data.active,
      userId,
    },
  })

  return channel
}

export async function findAllAlertChannels(userId: string, query: ListAlertChannelsQuery) {
  const where: { userId: string; active?: boolean; type?: string } = { userId }

  if (query.active !== undefined) {
    where.active = query.active === 'true'
  }

  if (query.type) {
    where.type = query.type
  }

  const [channels, total] = await Promise.all([
    prisma.alertChannel.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      skip: query.offset,
    }),
    prisma.alertChannel.count({ where }),
  ])

  return {
    channels,
    total,
    limit: query.limit,
    offset: query.offset,
  }
}

export async function findAlertChannelById(userId: string, id: string) {
  const channel = await prisma.alertChannel.findFirst({
    where: { id, userId },
  })

  return channel
}

export async function updateAlertChannel(
  userId: string,
  id: string,
  data: UpdateAlertChannelInput
) {
  const existing = await prisma.alertChannel.findFirst({
    where: { id, userId },
  })

  if (!existing) {
    return null
  }

  const channel = await prisma.alertChannel.update({
    where: { id },
    data: {
      name: data.name,
      config: data.config as object | undefined,
      active: data.active,
    },
  })

  return channel
}

export async function deleteAlertChannel(userId: string, id: string) {
  const existing = await prisma.alertChannel.findFirst({
    where: { id, userId },
  })

  if (!existing) {
    return false
  }

  await prisma.alertChannel.delete({
    where: { id },
  })

  return true
}

// Busca todos os canais ativos de um usuário (para enviar alertas)
export async function findActiveChannelsByUserId(userId: string) {
  return prisma.alertChannel.findMany({
    where: { userId, active: true },
  })
}

// Registra um alerta enviado
export async function createAlert(
  monitorId: string,
  alertChannelId: string,
  type: 'up' | 'down' | 'degraded',
  message: string
) {
  return prisma.alert.create({
    data: {
      monitorId,
      alertChannelId,
      type,
      message,
    },
  })
}

// Busca último alerta de um monitor (para evitar spam)
export async function findLastAlert(monitorId: string) {
  return prisma.alert.findFirst({
    where: { monitorId },
    orderBy: { sentAt: 'desc' },
  })
}
