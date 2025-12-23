import type { FastifyInstance } from 'fastify'
import {
  createAlertChannelSchema,
  updateAlertChannelSchema,
  alertChannelIdSchema,
  listAlertChannelsQuerySchema,
} from './alerts.schema.js'
import * as alertsService from './alerts.service.js'

// ============================================
// Rotas de Alert Channels - CRUD completo
// ============================================

export async function alertsRoutes(app: FastifyInstance) {
  // Todas as rotas requerem autenticação
  app.addHook('onRequest', app.authenticate)

  // POST /alerts/channels - Criar novo canal
  app.post('/channels', async (request, reply) => {
    const parseResult = createAlertChannelSchema.safeParse(request.body)

    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Dados inválidos',
        details: parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
    }

    const channel = await alertsService.createAlertChannel(
      request.user.sub,
      parseResult.data
    )

    return reply.status(201).send(channel)
  })

  // GET /alerts/channels - Listar canais do usuário
  app.get('/channels', async (request, reply) => {
    const parseResult = listAlertChannelsQuerySchema.safeParse(request.query)

    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Parâmetros inválidos',
        details: parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
    }

    const result = await alertsService.findAllAlertChannels(
      request.user.sub,
      parseResult.data
    )

    return reply.send(result)
  })

  // GET /alerts/channels/:id - Buscar canal por ID
  app.get('/channels/:id', async (request, reply) => {
    const parseResult = alertChannelIdSchema.safeParse(request.params)

    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'ID inválido',
      })
    }

    const channel = await alertsService.findAlertChannelById(
      request.user.sub,
      parseResult.data.id
    )

    if (!channel) {
      return reply.status(404).send({
        error: 'Canal não encontrado',
      })
    }

    return reply.send(channel)
  })

  // PUT /alerts/channels/:id - Atualizar canal
  app.put('/channels/:id', async (request, reply) => {
    const idResult = alertChannelIdSchema.safeParse(request.params)

    if (!idResult.success) {
      return reply.status(400).send({
        error: 'ID inválido',
      })
    }

    const bodyResult = updateAlertChannelSchema.safeParse(request.body)

    if (!bodyResult.success) {
      return reply.status(400).send({
        error: 'Dados inválidos',
        details: bodyResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
    }

    const channel = await alertsService.updateAlertChannel(
      request.user.sub,
      idResult.data.id,
      bodyResult.data
    )

    if (!channel) {
      return reply.status(404).send({
        error: 'Canal não encontrado',
      })
    }

    return reply.send(channel)
  })

  // DELETE /alerts/channels/:id - Deletar canal
  app.delete('/channels/:id', async (request, reply) => {
    const parseResult = alertChannelIdSchema.safeParse(request.params)

    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'ID inválido',
      })
    }

    const deleted = await alertsService.deleteAlertChannel(
      request.user.sub,
      parseResult.data.id
    )

    if (!deleted) {
      return reply.status(404).send({
        error: 'Canal não encontrado',
      })
    }

    return reply.status(204).send()
  })
}
