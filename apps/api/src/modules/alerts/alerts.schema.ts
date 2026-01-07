import { z } from 'zod'

// ============================================
// Schemas de Validação - Alert Channels
// ============================================

// Config para cada tipo de canal
const emailConfigSchema = z.object({
  email: z.string().email('Email inválido'),
})

const webhookConfigSchema = z.object({
  url: z.string().url('URL inválida'),
  method: z.enum(['POST', 'GET']).default('POST'),
  headers: z.record(z.string()).optional(),
})

const slackConfigSchema = z.object({
  webhookUrl: z.string().url('URL do webhook inválida'),
  channel: z.string().optional(),
})

// Schema para criar um canal de alerta
export const createAlertChannelSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  type: z.enum(['email', 'webhook', 'slack']),
  config: z.union([emailConfigSchema, webhookConfigSchema, slackConfigSchema]),
  active: z.boolean().default(true),
})

// Schema para atualizar um canal
export const updateAlertChannelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  config: z.union([emailConfigSchema, webhookConfigSchema, slackConfigSchema]).optional(),
  active: z.boolean().optional(),
})

// Schema para parâmetros de ID
// Nota: Prisma usa CUID (25 chars) ou CUID2 (variável), então validamos apenas como string não-vazia
export const alertChannelIdSchema = z.object({
  id: z.string().min(1, 'ID é obrigatório'),
})

// Schema para query de listagem
export const listAlertChannelsQuerySchema = z.object({
  active: z.enum(['true', 'false']).optional(),
  type: z.enum(['email', 'webhook', 'slack']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

// Tipos inferidos
export type CreateAlertChannelInput = z.infer<typeof createAlertChannelSchema>
export type UpdateAlertChannelInput = z.infer<typeof updateAlertChannelSchema>
export type AlertChannelIdParams = z.infer<typeof alertChannelIdSchema>
export type ListAlertChannelsQuery = z.infer<typeof listAlertChannelsQuerySchema>

// Tipos de configuração
export type EmailConfig = z.infer<typeof emailConfigSchema>
export type WebhookConfig = z.infer<typeof webhookConfigSchema>
export type SlackConfig = z.infer<typeof slackConfigSchema>
export type AlertChannelConfig = EmailConfig | WebhookConfig | SlackConfig

// Interface do AlertChannel completo
export interface AlertChannel {
  id: string
  name: string
  type: 'email' | 'webhook' | 'slack'
  config: AlertChannelConfig
  active: boolean
  createdAt: Date
  updatedAt: Date
  userId: string
}
