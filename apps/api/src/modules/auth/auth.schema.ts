import { z } from 'zod'

// ============================================
// Schemas de Validação - Autenticação
// ============================================

// Schema para registro de novo usuário
export const registerSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .transform((email) => email.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
  name: z
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .optional(),
})

// Schema para login
export const loginSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .transform((email) => email.toLowerCase().trim()),
  password: z.string().min(1, 'Senha é obrigatória'),
})

// Schema para recuperação de senha
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Email inválido')
    .transform((email) => email.toLowerCase().trim()),
})

// Schema para reset de senha
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  password: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
})

// Tipos inferidos dos schemas
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>

// Tipo do payload do JWT
export interface JwtPayload {
  sub: string // userId
  email: string
}

// Tipo do usuário retornado (sem senha)
export interface UserResponse {
  id: string
  email: string
  name: string | null
  createdAt: Date
}
