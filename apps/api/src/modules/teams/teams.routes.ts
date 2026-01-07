import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import * as teamsService from './teams.service.js'
import {
  createTeamSchema,
  updateTeamSchema,
  teamIdSchema,
  userIdSchema,
  updateMemberRoleSchema,
  createInviteSchema,
  inviteTokenSchema,
} from './teams.schema.js'

export async function teamsRoutes(app: FastifyInstance) {
  // Todas as rotas de teams requerem autenticação
  app.addHook('onRequest', app.authenticate)

  // ============================================
  // CRUD de Times
  // ============================================

  // Criar novo time
  app.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = createTeamSchema.safeParse(request.body)

    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Dados inválidos',
        details: parseResult.error.errors,
      })
    }

    try {
      const team = await teamsService.createTeam(
        request.user.sub,
        parseResult.data
      )
      return reply.status(201).send(team)
    } catch (error) {
      if (error instanceof Error && error.message === 'Slug já está em uso') {
        return reply.status(409).send({ error: error.message })
      }
      throw error
    }
  })

  // Listar meus times
  app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const teams = await teamsService.findAllTeams(request.user.sub)
    return reply.send(teams)
  })

  // Obter time por ID
  app.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = teamIdSchema.safeParse(request.params)

    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Parâmetros inválidos',
        details: parseResult.error.errors,
      })
    }

    const team = await teamsService.findTeamById(
      request.user.sub,
      parseResult.data.id
    )

    if (!team) {
      return reply.status(404).send({ error: 'Time não encontrado' })
    }

    return reply.send(team)
  })

  // Atualizar time
  app.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const paramsResult = teamIdSchema.safeParse(request.params)
    const bodyResult = updateTeamSchema.safeParse(request.body)

    if (!paramsResult.success) {
      return reply.status(400).send({
        error: 'Parâmetros inválidos',
        details: paramsResult.error.errors,
      })
    }

    if (!bodyResult.success) {
      return reply.status(400).send({
        error: 'Dados inválidos',
        details: bodyResult.error.errors,
      })
    }

    try {
      const team = await teamsService.updateTeam(
        request.user.sub,
        paramsResult.data.id,
        bodyResult.data
      )

      if (!team) {
        return reply.status(403).send({
          error: 'Sem permissão para atualizar este time',
        })
      }

      return reply.send(team)
    } catch (error) {
      if (error instanceof Error && error.message === 'Slug já está em uso') {
        return reply.status(409).send({ error: error.message })
      }
      throw error
    }
  })

  // Deletar time
  app.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = teamIdSchema.safeParse(request.params)

    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Parâmetros inválidos',
        details: parseResult.error.errors,
      })
    }

    const deleted = await teamsService.deleteTeam(
      request.user.sub,
      parseResult.data.id
    )

    if (!deleted) {
      return reply.status(403).send({
        error: 'Apenas o owner pode deletar o time',
      })
    }

    return reply.status(204).send()
  })

  // ============================================
  // Gerenciamento de Membros
  // ============================================

  // Listar membros do time
  app.get(
    '/:id/members',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parseResult = teamIdSchema.safeParse(request.params)

      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Parâmetros inválidos',
          details: parseResult.error.errors,
        })
      }

      const members = await teamsService.getTeamMembers(
        request.user.sub,
        parseResult.data.id
      )

      if (!members) {
        return reply.status(404).send({ error: 'Time não encontrado' })
      }

      return reply.send(members)
    }
  )

  // Atualizar role de membro
  app.put(
    '/:id/members/:userId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const paramsResult = teamIdSchema
        .merge(userIdSchema)
        .safeParse(request.params)
      const bodyResult = updateMemberRoleSchema.safeParse(request.body)

      if (!paramsResult.success) {
        return reply.status(400).send({
          error: 'Parâmetros inválidos',
          details: paramsResult.error.errors,
        })
      }

      if (!bodyResult.success) {
        return reply.status(400).send({
          error: 'Dados inválidos',
          details: bodyResult.error.errors,
        })
      }

      try {
        const member = await teamsService.updateMemberRole(
          request.user.sub,
          paramsResult.data.id,
          paramsResult.data.userId,
          bodyResult.data.role
        )

        if (!member) {
          return reply.status(403).send({
            error: 'Sem permissão para alterar roles neste time',
          })
        }

        return reply.send(member)
      } catch (error) {
        if (error instanceof Error) {
          return reply.status(400).send({ error: error.message })
        }
        throw error
      }
    }
  )

  // Remover membro do time
  app.delete(
    '/:id/members/:userId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parseResult = teamIdSchema
        .merge(userIdSchema)
        .safeParse(request.params)

      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Parâmetros inválidos',
          details: parseResult.error.errors,
        })
      }

      try {
        const removed = await teamsService.removeMember(
          request.user.sub,
          parseResult.data.id,
          parseResult.data.userId
        )

        if (!removed) {
          return reply.status(403).send({
            error: 'Sem permissão para remover membros deste time',
          })
        }

        return reply.status(204).send()
      } catch (error) {
        if (error instanceof Error) {
          return reply.status(400).send({ error: error.message })
        }
        throw error
      }
    }
  )

  // Sair do time
  app.post(
    '/:id/leave',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parseResult = teamIdSchema.safeParse(request.params)

      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Parâmetros inválidos',
          details: parseResult.error.errors,
        })
      }

      try {
        const left = await teamsService.leaveTeam(
          request.user.sub,
          parseResult.data.id
        )

        if (!left) {
          return reply.status(404).send({ error: 'Você não é membro deste time' })
        }

        return reply.status(204).send()
      } catch (error) {
        if (error instanceof Error) {
          return reply.status(400).send({ error: error.message })
        }
        throw error
      }
    }
  )

  // ============================================
  // Sistema de Convites
  // ============================================

  // Criar convite
  app.post(
    '/:id/invites',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const paramsResult = teamIdSchema.safeParse(request.params)
      const bodyResult = createInviteSchema.safeParse(request.body)

      if (!paramsResult.success) {
        return reply.status(400).send({
          error: 'Parâmetros inválidos',
          details: paramsResult.error.errors,
        })
      }

      if (!bodyResult.success) {
        return reply.status(400).send({
          error: 'Dados inválidos',
          details: bodyResult.error.errors,
        })
      }

      try {
        const invite = await teamsService.createInvite(
          request.user.sub,
          paramsResult.data.id,
          bodyResult.data
        )

        if (!invite) {
          return reply.status(403).send({
            error: 'Sem permissão para criar convites neste time',
          })
        }

        return reply.status(201).send(invite)
      } catch (error) {
        if (error instanceof Error) {
          return reply.status(400).send({ error: error.message })
        }
        throw error
      }
    }
  )

  // Listar convites do time
  app.get(
    '/:id/invites',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parseResult = teamIdSchema.safeParse(request.params)

      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Parâmetros inválidos',
          details: parseResult.error.errors,
        })
      }

      const invites = await teamsService.getTeamInvites(
        request.user.sub,
        parseResult.data.id
      )

      if (!invites) {
        return reply.status(403).send({
          error: 'Sem permissão para ver convites deste time',
        })
      }

      return reply.send(invites)
    }
  )

  // Revogar convite
  app.delete(
    '/:id/invites/:inviteId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parseResult = teamIdSchema
        .extend({ inviteId: inviteTokenSchema.shape.token })
        .safeParse(request.params)

      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Parâmetros inválidos',
          details: parseResult.error.errors,
        })
      }

      const revoked = await teamsService.revokeInvite(
        request.user.sub,
        parseResult.data.id,
        parseResult.data.inviteId
      )

      if (!revoked) {
        return reply.status(403).send({
          error: 'Sem permissão para revogar este convite',
        })
      }

      return reply.status(204).send()
    }
  )
}

// ============================================
// Rotas públicas de convites (separadas)
// ============================================

export async function invitesRoutes(app: FastifyInstance) {
  // Obter informações do convite (público)
  app.get('/:token', async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = inviteTokenSchema.safeParse(request.params)

    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Token inválido',
        details: parseResult.error.errors,
      })
    }

    const invite = await teamsService.getInviteByToken(parseResult.data.token)

    if (!invite) {
      return reply.status(404).send({ error: 'Convite não encontrado ou expirado' })
    }

    return reply.send(invite)
  })

  // Aceitar convite (requer autenticação)
  app.post(
    '/:token/accept',
    { onRequest: [app.authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parseResult = inviteTokenSchema.safeParse(request.params)

      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'Token inválido',
          details: parseResult.error.errors,
        })
      }

      try {
        const result = await teamsService.acceptInvite(
          request.user.sub,
          parseResult.data.token
        )

        if (!result) {
          return reply.status(404).send({ error: 'Convite não encontrado' })
        }

        return reply.send(result)
      } catch (error) {
        if (error instanceof Error) {
          return reply.status(400).send({ error: error.message })
        }
        throw error
      }
    }
  )
}
