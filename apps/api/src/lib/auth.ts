import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import type { JwtPayload } from '../modules/auth/auth.schema.js'

// ============================================
// Middleware e Decorators de Autenticação
// ============================================

// Estende os tipos do Fastify para incluir o método authenticate
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>
  }
}

// Estende o tipo do request para incluir o user do JWT
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload
    user: JwtPayload
  }
}

// ============================================
// Registra o decorator de autenticação
// ============================================
export async function registerAuthDecorator(app: FastifyInstance) {
  // Decorator que verifica se o usuário está autenticado
  app.decorate(
    'authenticate',
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        // Verifica e decodifica o token JWT
        await request.jwtVerify()
      } catch (err) {
        return reply.status(401).send({
          error: 'Token inválido ou expirado',
          code: 'UNAUTHORIZED',
        })
      }
    }
  )
}
