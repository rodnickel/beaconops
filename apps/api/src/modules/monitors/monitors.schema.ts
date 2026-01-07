import { z } from 'zod'

// ============================================
// Schemas de Validação - Monitors
// ============================================

// Schema para criar um monitor
export const createMonitorSchema = z.object({
  name: z
    .string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  url: z
    .string()
    .url('URL inválida')
    .refine(
      (url) => url.startsWith('http://') || url.startsWith('https://'),
      'URL deve começar com http:// ou https://'
    ),
  method: z.enum(['GET', 'POST', 'HEAD']).default('GET'),
  intervalSeconds: z
    .number()
    .int()
    .min(5, 'Intervalo mínimo é 5 segundos')
    .max(3600, 'Intervalo máximo é 3600 segundos (1 hora)')
    .default(300),
  timeout: z
    .number()
    .int()
    .min(5, 'Timeout mínimo é 5 segundos')
    .max(60, 'Timeout máximo é 60 segundos')
    .default(30),
  expectedStatus: z
    .number()
    .int()
    .min(100)
    .max(599)
    .default(200),
  checkSsl: z.boolean().default(true),
  active: z.boolean().default(true),
  alertsEnabled: z.boolean().default(true),
})

// Schema para atualizar um monitor
export const updateMonitorSchema = createMonitorSchema.partial()

// Schema para parâmetros de ID
// Nota: Prisma usa CUID (25 chars) ou CUID2 (variável), então validamos apenas como string não-vazia
export const monitorIdSchema = z.object({
  id: z.string().min(1, 'ID é obrigatório'),
})

// Schema para query de listagem
export const listMonitorsQuerySchema = z.object({
  active: z.enum(['true', 'false']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

// Tipos inferidos
export type CreateMonitorInput = z.infer<typeof createMonitorSchema>
export type UpdateMonitorInput = z.infer<typeof updateMonitorSchema>
export type MonitorIdParams = z.infer<typeof monitorIdSchema>
export type ListMonitorsQuery = z.infer<typeof listMonitorsQuerySchema>

// Tipo do Monitor com status atual
export interface MonitorWithStatus {
  id: string
  name: string
  url: string
  method: string
  intervalSeconds: number
  timeout: number
  expectedStatus: number
  checkSsl: boolean
  active: boolean
  alertsEnabled: boolean
  createdAt: Date
  updatedAt: Date
  teamId: string
  // Status calculado
  currentStatus?: 'up' | 'down' | 'degraded' | 'unknown'
  lastCheck?: Date
  lastLatency?: number
  uptimePercentage?: number
}
