import { z } from 'zod'

// ============================================
// Schemas de Validação - Teams
// ============================================

// Enum de roles
export const teamRoleSchema = z.enum(['ADMIN', 'EDITOR', 'VIEWER'])
export type TeamRole = z.infer<typeof teamRoleSchema>

// Schema para criar um time
export const createTeamSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  slug: z
    .string()
    .min(2, 'Slug deve ter no mínimo 2 caracteres')
    .max(50, 'Slug deve ter no máximo 50 caracteres')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug deve conter apenas letras minúsculas, números e hífens'
    ),
})

// Schema para atualizar um time
export const updateTeamSchema = createTeamSchema.partial()

// Schema para parâmetros de ID do time
export const teamIdSchema = z.object({
  id: z.string().min(1, 'ID é obrigatório'),
})

// Schema para parâmetros de ID do usuário
export const userIdSchema = z.object({
  userId: z.string().min(1, 'ID do usuário é obrigatório'),
})

// Schema para atualizar role de membro
export const updateMemberRoleSchema = z.object({
  role: teamRoleSchema,
})

// Schema para criar convite
export const createInviteSchema = z.object({
  email: z.string().email('Email inválido').optional(),
  role: teamRoleSchema.default('VIEWER'),
  expiresInDays: z.number().int().min(1).max(30).default(7),
  maxUses: z.number().int().min(0).max(100).default(1), // 0 = ilimitado
})

// Schema para token de convite
export const inviteTokenSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
})

// Tipos inferidos
export type CreateTeamInput = z.infer<typeof createTeamSchema>
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>
export type TeamIdParams = z.infer<typeof teamIdSchema>
export type UserIdParams = z.infer<typeof userIdSchema>
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>
export type CreateInviteInput = z.infer<typeof createInviteSchema>
export type InviteTokenParams = z.infer<typeof inviteTokenSchema>

// Tipos de resposta
export interface TeamWithMembers {
  id: string
  name: string
  slug: string
  createdAt: Date
  updatedAt: Date
  ownerId: string
  owner: {
    id: string
    name: string | null
    email: string
  }
  members: {
    id: string
    role: TeamRole
    joinedAt: Date
    user: {
      id: string
      name: string | null
      email: string
    }
  }[]
  _count: {
    monitors: number
    alertChannels: number
    statusPages: number
  }
}

export interface TeamMemberInfo {
  id: string
  role: TeamRole
  joinedAt: Date
  user: {
    id: string
    name: string | null
    email: string
  }
}

export interface TeamInviteInfo {
  id: string
  email: string | null
  token: string
  role: TeamRole
  expiresAt: Date
  usedAt: Date | null
  maxUses: number
  useCount: number
  createdAt: Date
  invitedBy: {
    id: string
    name: string | null
    email: string
  }
}

export interface PublicInviteInfo {
  teamName: string
  teamSlug: string
  role: TeamRole
  expiresAt: Date
  invitedByName: string | null
  invitedByEmail: string
}
