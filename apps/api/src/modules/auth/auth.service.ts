import bcrypt from 'bcrypt'
import { prisma } from '../../lib/prisma.js'
import type {
  RegisterInput,
  LoginInput,
  UserResponse,
  JwtPayload,
} from './auth.schema.js'

// ============================================
// Serviço de Autenticação
// Contém toda a lógica de negócio relacionada a auth
// ============================================

// Número de rounds para o bcrypt (quanto maior, mais seguro mas mais lento)
const SALT_ROUNDS = 10

export class AuthService {
  // ----------------------------------------
  // Registrar novo usuário
  // ----------------------------------------
  async register(data: RegisterInput): Promise<UserResponse> {
    // Verifica se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      throw new AuthError('Email já cadastrado', 'EMAIL_EXISTS', 409)
    }

    // Gera hash da senha
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS)

    // Cria o usuário
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    })

    return user
  }

  // ----------------------------------------
  // Login do usuário
  // ----------------------------------------
  async login(data: LoginInput): Promise<{ user: UserResponse; payload: JwtPayload }> {
    // Busca usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (!user) {
      throw new AuthError('Credenciais inválidas', 'INVALID_CREDENTIALS', 401)
    }

    // Verifica a senha
    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash)

    if (!isPasswordValid) {
      throw new AuthError('Credenciais inválidas', 'INVALID_CREDENTIALS', 401)
    }

    // Prepara payload do JWT
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    }

    // Retorna usuário (sem senha) e payload para gerar token
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      payload,
    }
  }

  // ----------------------------------------
  // Buscar usuário por ID
  // ----------------------------------------
  async getUserById(userId: string): Promise<UserResponse | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    })

    return user
  }

  // ----------------------------------------
  // Buscar usuário por email
  // ----------------------------------------
  async getUserByEmail(email: string): Promise<UserResponse | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    })

    return user
  }
}

// ============================================
// Classe de Erro customizada para Auth
// ============================================
export class AuthError extends Error {
  public code: string
  public statusCode: number

  constructor(message: string, code: string, statusCode: number) {
    super(message)
    this.name = 'AuthError'
    this.code = code
    this.statusCode = statusCode
  }
}

// Exporta instância única do serviço
export const authService = new AuthService()
