import type { FastifyInstance } from 'fastify'
import {
  createStatusPageSchema,
  updateStatusPageSchema,
  statusPageIdSchema,
  statusPageSlugSchema,
  updateStatusPageLayoutSchema,
} from './status-pages.schema.js'
import * as statusPagesService from './status-pages.service.js'
import { createTeamAuthHook } from '../../lib/team-auth.js'

// ============================================
// Rotas de Status Pages - CRUD completo
// Atualizado para usar autenticação por time
// ============================================

export async function statusPagesRoutes(app: FastifyInstance) {
  // Hook para rotas de leitura (VIEWER)
  const viewerAuth = createTeamAuthHook('VIEWER')
  // Hook para rotas de escrita (EDITOR)
  const editorAuth = createTeamAuthHook('EDITOR')

  // POST /status-pages - Criar nova status page (requer EDITOR)
  app.post('/', { onRequest: [editorAuth] }, async (request, reply) => {
    const parseResult = createStatusPageSchema.safeParse(request.body)

    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Dados inválidos',
        details: parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
    }

    // Verifica se o slug já existe
    const slugAvailable = await statusPagesService.checkSlugAvailable(parseResult.data.slug)
    if (!slugAvailable) {
      return reply.status(400).send({
        error: 'Este slug já está em uso',
      })
    }

    const statusPage = await statusPagesService.createStatusPage(
      request.teamContext!.teamId,
      parseResult.data
    )

    return reply.status(201).send(statusPage)
  })

  // GET /status-pages - Listar status pages do time (requer VIEWER)
  app.get('/', { onRequest: [viewerAuth] }, async (request, reply) => {
    const statusPages = await statusPagesService.findAllStatusPages(request.teamContext!.teamId)
    return reply.send({ statusPages })
  })

  // GET /status-pages/:id - Buscar status page por ID (requer VIEWER)
  app.get('/:id', { onRequest: [viewerAuth] }, async (request, reply) => {
    const parseResult = statusPageIdSchema.safeParse(request.params)

    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'ID inválido',
      })
    }

    const statusPage = await statusPagesService.findStatusPageById(
      request.teamContext!.teamId,
      parseResult.data.id
    )

    if (!statusPage) {
      return reply.status(404).send({
        error: 'Status page não encontrada',
      })
    }

    return reply.send(statusPage)
  })

  // PUT /status-pages/:id - Atualizar status page (requer EDITOR)
  app.put('/:id', { onRequest: [editorAuth] }, async (request, reply) => {
    const idResult = statusPageIdSchema.safeParse(request.params)

    if (!idResult.success) {
      return reply.status(400).send({
        error: 'ID inválido',
      })
    }

    const bodyResult = updateStatusPageSchema.safeParse(request.body)

    if (!bodyResult.success) {
      return reply.status(400).send({
        error: 'Dados inválidos',
        details: bodyResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
    }

    // Se está atualizando o slug, verifica disponibilidade
    if (bodyResult.data.slug) {
      const slugAvailable = await statusPagesService.checkSlugAvailable(
        bodyResult.data.slug,
        idResult.data.id
      )
      if (!slugAvailable) {
        return reply.status(400).send({
          error: 'Este slug já está em uso',
        })
      }
    }

    const statusPage = await statusPagesService.updateStatusPage(
      request.teamContext!.teamId,
      idResult.data.id,
      bodyResult.data
    )

    if (!statusPage) {
      return reply.status(404).send({
        error: 'Status page não encontrada',
      })
    }

    return reply.send(statusPage)
  })

  // PUT /status-pages/:id/layout - Atualizar seções e monitors da status page (requer EDITOR)
  app.put('/:id/layout', { onRequest: [editorAuth] }, async (request, reply) => {
    const idResult = statusPageIdSchema.safeParse(request.params)

    if (!idResult.success) {
      return reply.status(400).send({
        error: 'ID inválido',
      })
    }

    const bodyResult = updateStatusPageLayoutSchema.safeParse(request.body)

    if (!bodyResult.success) {
      return reply.status(400).send({
        error: 'Dados inválidos',
        details: bodyResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
    }

    try {
      const statusPage = await statusPagesService.updateStatusPageLayout(
        request.teamContext!.teamId,
        idResult.data.id,
        bodyResult.data
      )

      if (!statusPage) {
        return reply.status(404).send({
          error: 'Status page não encontrada',
        })
      }

      return reply.send(statusPage)
    } catch (error) {
      return reply.status(400).send({
        error: error instanceof Error ? error.message : 'Erro ao atualizar layout',
      })
    }
  })

  // GET /status-pages/check-slug/:slug - Verificar disponibilidade do slug (requer VIEWER)
  app.get('/check-slug/:slug', { onRequest: [viewerAuth] }, async (request, reply) => {
    const parseResult = statusPageSlugSchema.safeParse(request.params)

    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Slug inválido',
      })
    }

    const available = await statusPagesService.checkSlugAvailable(parseResult.data.slug)
    return reply.send({ available })
  })

  // DELETE /status-pages/:id - Deletar status page (requer EDITOR)
  app.delete('/:id', { onRequest: [editorAuth] }, async (request, reply) => {
    const parseResult = statusPageIdSchema.safeParse(request.params)

    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'ID inválido',
      })
    }

    const deleted = await statusPagesService.deleteStatusPage(
      request.teamContext!.teamId,
      parseResult.data.id
    )

    if (!deleted) {
      return reply.status(404).send({
        error: 'Status page não encontrada',
      })
    }

    return reply.status(204).send()
  })
}

// ============================================
// Rotas Públicas (sem autenticação)
// ============================================

export async function publicStatusPageRoutes(app: FastifyInstance) {
  // GET /public/status/:slug - Buscar status page pública
  app.get('/:slug', async (request, reply) => {
    const parseResult = statusPageSlugSchema.safeParse(request.params)

    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Slug inválido',
      })
    }

    const statusPage = await statusPagesService.getPublicStatusPage(parseResult.data.slug)

    if (!statusPage) {
      return reply.status(404).send({
        error: 'Status page não encontrada',
      })
    }

    return reply.send(statusPage)
  })
}
