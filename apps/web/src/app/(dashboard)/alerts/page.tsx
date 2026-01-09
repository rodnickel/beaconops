'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import * as api from '@/lib/api'
import type { AlertChannel, ApiError } from '@/lib/api'
import { ConfirmModal, AlertModal } from '@/components'

function ChannelTypeIcon({ type }: { type: AlertChannel['type'] }) {
  if (type === 'email') {
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    )
  }
  if (type === 'webhook') {
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
      </svg>
    )
  }
  if (type === 'whatsapp') {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    )
  }
  if (type === 'telegram') {
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    )
  }
  // slack
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
    </svg>
  )
}

function ChannelTypeBadge({ type }: { type: AlertChannel['type'] }) {
  const styles: Record<AlertChannel['type'], string> = {
    email: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    webhook: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    slack: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    whatsapp: 'bg-green-500/10 text-green-400 border-green-500/20',
    telegram: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  }

  const labels: Record<AlertChannel['type'], string> = {
    email: 'Email',
    webhook: 'Webhook',
    slack: 'Slack',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border ${styles[type]}`}>
      <ChannelTypeIcon type={type} />
      {labels[type]}
    </span>
  )
}

function getChannelDescription(channel: AlertChannel): string {
  const config = channel.config as Record<string, string>
  switch (channel.type) {
    case 'email':
      return config.email || config.to || ''
    case 'webhook':
      return config.url || ''
    case 'slack':
      return 'Canal do Slack configurado'
    case 'whatsapp':
      return config.phone ? `+${config.phone}` : ''
    case 'telegram':
      return `Chat ID: ${config.chatId || ''}`
    default:
      return ''
  }
}

function getChannelIconStyle(type: AlertChannel['type']): string {
  const styles: Record<AlertChannel['type'], string> = {
    email: 'bg-blue-500/10 text-blue-400',
    webhook: 'bg-purple-500/10 text-purple-400',
    slack: 'bg-amber-500/10 text-amber-400',
    whatsapp: 'bg-green-500/10 text-green-400',
    telegram: 'bg-sky-500/10 text-sky-400',
  }
  return styles[type]
}

export default function AlertsPage() {
  const router = useRouter()
  const [channels, setChannels] = useState<AlertChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; channel: AlertChannel | null }>({ open: false, channel: null })
  const [alertModal, setAlertModal] = useState<{ open: boolean; message: string; variant: 'success' | 'error' }>({ open: false, message: '', variant: 'error' })
  const [testingChannel, setTestingChannel] = useState<string | null>(null)

  useEffect(() => {
    loadChannels()
  }, [])

  async function loadChannels() {
    try {
      const data = await api.getAlertChannels()
      setChannels(data.channels)
    } catch (err) {
      const apiError = err as ApiError
      if (apiError.code === 'UNAUTHORIZED') {
        router.push('/login')
        return
      }
      setError(apiError.error || 'Erro ao carregar canais de alerta')
    } finally {
      setLoading(false)
    }
  }

  async function handleToggleActive(channel: AlertChannel) {
    try {
      const updated = await api.updateAlertChannel(channel.id, { active: !channel.active })
      setChannels(channels.map(c => c.id === channel.id ? updated : c))
    } catch (err) {
      const apiError = err as ApiError
      setAlertModal({ open: true, message: apiError.error || 'Erro ao atualizar canal', variant: 'error' })
    }
  }

  async function handleTestChannel(channel: AlertChannel) {
    setTestingChannel(channel.id)
    try {
      await api.testAlertChannel(channel.id)
      setAlertModal({ open: true, message: 'Notificação de teste enviada com sucesso!', variant: 'success' })
    } catch (err) {
      const apiError = err as ApiError
      setAlertModal({ open: true, message: apiError.error || 'Erro ao enviar notificação de teste', variant: 'error' })
    } finally {
      setTestingChannel(null)
    }
  }

  function handleDeleteClick(channel: AlertChannel) {
    setDeleteModal({ open: true, channel })
  }

  async function handleDeleteConfirm() {
    if (!deleteModal.channel) return
    const channelToDelete = deleteModal.channel
    setDeleteModal({ open: false, channel: null })

    try {
      await api.deleteAlertChannel(channelToDelete.id)
      setChannels(channels.filter(c => c.id !== channelToDelete.id))
    } catch (err) {
      const apiError = err as ApiError
      setAlertModal({ open: true, message: apiError.error || 'Erro ao deletar canal', variant: 'error' })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-zinc-400">Carregando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Canais de Alerta</h1>
          <p className="text-zinc-400 mt-1">Configure como você quer receber notificações</p>
        </div>
        <Link
          href="/alerts/new"
          className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Novo Canal
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Empty state */}
      {channels.length === 0 && !error && (
        <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-xl">
          <svg className="w-12 h-12 mx-auto text-zinc-600 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          <h3 className="text-lg font-medium text-white mb-2">Nenhum canal configurado</h3>
          <p className="text-zinc-400 mb-6">Configure um canal para receber alertas quando seus monitores ficarem offline.</p>
          <Link
            href="/alerts/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-medium rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Criar primeiro canal
          </Link>
        </div>
      )}

      {/* Channels list */}
      {channels.length > 0 && (
        <div className="space-y-3">
          {channels.map((channel) => (
            <div
              key={channel.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getChannelIconStyle(channel.type)}`}>
                    <ChannelTypeIcon type={channel.type} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-white">{channel.name}</h3>
                      <ChannelTypeBadge type={channel.type} />
                      {!channel.active && (
                        <span className="text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">inativo</span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-500 mt-1">
                      {getChannelDescription(channel)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTestChannel(channel)}
                    disabled={testingChannel === channel.id || !channel.active}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                    title={!channel.active ? 'Ative o canal para testar' : 'Enviar notificação de teste'}
                  >
                    {testingChannel === channel.id ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
                        Testar
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleToggleActive(channel)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      channel.active
                        ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                        : 'bg-orange-600/20 text-orange-400 hover:bg-orange-600/30'
                    }`}
                  >
                    {channel.active ? 'Desativar' : 'Ativar'}
                  </button>
                  <Link
                    href={`/alerts/${channel.id}/edit`}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
                  >
                    Editar
                  </Link>
                  <button
                    onClick={() => handleDeleteClick(channel)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    Deletar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.open}
        title="Deletar Canal"
        message={`Tem certeza que deseja deletar o canal "${deleteModal.channel?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Deletar"
        cancelText="Cancelar"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ open: false, channel: null })}
      />

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.open}
        title={alertModal.variant === 'success' ? 'Sucesso' : 'Erro'}
        message={alertModal.message}
        variant={alertModal.variant}
        onClose={() => setAlertModal({ open: false, message: '', variant: 'error' })}
      />
    </div>
  )
}
