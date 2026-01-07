import type { FastifyInstance } from 'fastify'
import {
  createAlertChannelSchema,
  updateAlertChannelSchema,
  alertChannelIdSchema,
  listAlertChannelsQuerySchema,
} from './alerts.schema.js'
import * as alertsService from './alerts.service.js'
import { createTeamAuthHook } from '../../lib/team-auth.js'

// ============================================
// Rotas de Alert Channels - CRUD completo
// Atualizado para usar autenticação por time
// ============================================

export async function alertsRoutes(app: FastifyInstance) {
  // Hook para rotas de leitura (VIEWER)
  const viewerAuth = createTeamAuthHook('VIEWER')
  // Hook para rotas de escrita (EDITOR)
  const editorAuth = createTeamAuthHook('EDITOR')

  // POST /alerts/channels - Criar novo canal (requer EDITOR)
  app.post('/channels', { onRequest: [editorAuth] }, async (request, reply) => {
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
      request.teamContext!.teamId,
      parseResult.data
    )

    return reply.status(201).send(channel)
  })

  // GET /alerts/channels - Listar canais do time (requer VIEWER)
  app.get('/channels', { onRequest: [viewerAuth] }, async (request, reply) => {
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
      request.teamContext!.teamId,
      parseResult.data
    )

    return reply.send(result)
  })

  // GET /alerts/channels/:id - Buscar canal por ID (requer VIEWER)
  app.get('/channels/:id', { onRequest: [viewerAuth] }, async (request, reply) => {
    const parseResult = alertChannelIdSchema.safeParse(request.params)

    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'ID inválido',
      })
    }

    const channel = await alertsService.findAlertChannelById(
      request.teamContext!.teamId,
      parseResult.data.id
    )

    if (!channel) {
      return reply.status(404).send({
        error: 'Canal não encontrado',
      })
    }

    return reply.send(channel)
  })

  // PUT /alerts/channels/:id - Atualizar canal (requer EDITOR)
  app.put('/channels/:id', { onRequest: [editorAuth] }, async (request, reply) => {
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
      request.teamContext!.teamId,
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

  // DELETE /alerts/channels/:id - Deletar canal (requer EDITOR)
  app.delete('/channels/:id', { onRequest: [editorAuth] }, async (request, reply) => {
    const parseResult = alertChannelIdSchema.safeParse(request.params)

    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'ID inválido',
      })
    }

    const deleted = await alertsService.deleteAlertChannel(
      request.teamContext!.teamId,
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
