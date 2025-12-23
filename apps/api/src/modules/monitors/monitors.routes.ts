import type { FastifyInstance } from 'fastify'
import {
  createMonitorSchema,
  updateMonitorSchema,
  monitorIdSchema,
  listMonitorsQuerySchema,
} from './monitors.schema.js'
import * as monitorsService from './monitors.service.js'

// ============================================
// Rotas de Monitors - CRUD completo
// ============================================

export async function monitorsRoutes(app: FastifyInstance) {
  // Todas as rotas de monitors requerem autenticação
  app.addHook('onRequest', app.authenticate)

  // POST /monitors - Criar novo monitor
  app.post('/', async (request, reply) => {
    const parseResult = createMonitorSchema.safeParse(request.body)

    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Dados inválidos',
        details: parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
    }

    const monitor = await monitorsService.createMonitor(
      request.user.sub,
      parseResult.data
    )

    return reply.status(201).send(monitor)
  })

  // GET /monitors - Listar monitors do usuário
  app.get('/', async (request, reply) => {
    const parseResult = listMonitorsQuerySchema.safeParse(request.query)

    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Parâmetros inválidos',
        details: parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
    }

    const result = await monitorsService.findAllMonitorsWithStatus(
      request.user.sub,
      parseResult.data
    )

    return reply.send(result)
  })

  // GET /monitors/:id - Buscar monitor por ID
  app.get('/:id', async (request, reply) => {
    const parseResult = monitorIdSchema.safeParse(request.params)

    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'ID inválido',
      })
    }

    const monitor = await monitorsService.getMonitorWithStatus(
      request.user.sub,
      parseResult.data.id
    )

    if (!monitor) {
      return reply.status(404).send({
        error: 'Monitor não encontrado',
      })
    }

    return reply.send(monitor)
  })

  // PUT /monitors/:id - Atualizar monitor
  app.put('/:id', async (request, reply) => {
    const idResult = monitorIdSchema.safeParse(request.params)

    if (!idResult.success) {
      return reply.status(400).send({
        error: 'ID inválido',
      })
    }

    const bodyResult = updateMonitorSchema.safeParse(request.body)

    if (!bodyResult.success) {
      return reply.status(400).send({
        error: 'Dados inválidos',
        details: bodyResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
    }

    const monitor = await monitorsService.updateMonitor(
      request.user.sub,
      idResult.data.id,
      bodyResult.data
    )

    if (!monitor) {
      return reply.status(404).send({
        error: 'Monitor não encontrado',
      })
    }

    return reply.send(monitor)
  })

  // DELETE /monitors/:id - Deletar monitor
  app.delete('/:id', async (request, reply) => {
    const parseResult = monitorIdSchema.safeParse(request.params)

    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'ID inválido',
      })
    }

    const deleted = await monitorsService.deleteMonitor(
      request.user.sub,
      parseResult.data.id
    )

    if (!deleted) {
      return reply.status(404).send({
        error: 'Monitor não encontrado',
      })
    }

    return reply.status(204).send()
  })
}
