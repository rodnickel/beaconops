import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { authService, AuthError } from './auth.service.js'
import {
  registerSchema,
  loginSchema,
  type JwtPayload,
} from './auth.schema.js'
import { ZodError } from 'zod'

// ============================================
// Rotas de Autenticação
// ============================================

export async function authRoutes(app: FastifyInstance) {
  // ----------------------------------------
  // POST /auth/register - Criar nova conta
  // ----------------------------------------
  app.post('/register', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Valida os dados de entrada
      const data = registerSchema.parse(request.body)

      // Registra o usuário
      const user = await authService.register(data)

      // Gera o token JWT
      const token = app.jwt.sign({
        sub: user.id,
        email: user.email,
      } satisfies JwtPayload)

      return reply.status(201).send({
        message: 'Usuário criado com sucesso',
        user,
        token,
      })
    } catch (error) {
      return handleAuthError(error, reply)
    }
  })

  // ----------------------------------------
  // POST /auth/login - Fazer login
  // ----------------------------------------
  app.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Valida os dados de entrada
      const data = loginSchema.parse(request.body)

      // Faz o login
      const { user, payload } = await authService.login(data)

      // Gera o token JWT
      const token = app.jwt.sign(payload)

      return reply.send({
        message: 'Login realizado com sucesso',
        user,
        token,
      })
    } catch (error) {
      return handleAuthError(error, reply)
    }
  })

  // ----------------------------------------
  // GET /auth/me - Dados do usuário logado
  // ----------------------------------------
  app.get(
    '/me',
    { onRequest: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // O middleware já validou o token e adicionou o user ao request
        const userId = request.user.sub

        const user = await authService.getUserById(userId)

        if (!user) {
          return reply.status(404).send({
            error: 'Usuário não encontrado',
            code: 'USER_NOT_FOUND',
          })
        }

        return reply.send({ user })
      } catch (error) {
        return handleAuthError(error, reply)
      }
    }
  )

  // ----------------------------------------
  // POST /auth/logout - Fazer logout
  // Obs: Como usamos JWT stateless, o logout é feito no frontend
  // removendo o token. Esta rota existe para consistência da API.
  // ----------------------------------------
  app.post(
    '/logout',
    { onRequest: [app.authenticate] },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      return reply.send({
        message: 'Logout realizado com sucesso',
      })
    }
  )
}

// ============================================
// Handler de erros de autenticação
// ============================================
function handleAuthError(error: unknown, reply: FastifyReply) {
  // Erro de validação do Zod
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: 'Dados inválidos',
      code: 'VALIDATION_ERROR',
      details: error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    })
  }

  // Erro de autenticação customizado
  if (error instanceof AuthError) {
    return reply.status(error.statusCode).send({
      error: error.message,
      code: error.code,
    })
  }

  // Erro inesperado
  console.error('Erro inesperado em auth:', error)
  return reply.status(500).send({
    error: 'Erro interno do servidor',
    code: 'INTERNAL_ERROR',
  })
}
