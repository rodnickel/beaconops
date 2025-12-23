// ============================================
// Cliente HTTP para comunicação com a API
// ============================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'

// Tipos de resposta da API
export interface ApiError {
  error: string
  code: string
  details?: Array<{ field: string; message: string }>
}

export interface User {
  id: string
  email: string
  name: string | null
  createdAt: string
}

export interface AuthResponse {
  message: string
  user: User
  token: string
}

// ----------------------------------------
// Função base para fazer requisições
// ----------------------------------------
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`

  // Pega o token do localStorage (se existir)
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw data as ApiError
  }

  return data as T
}

// ============================================
// Funções de Autenticação
// ============================================

export async function register(email: string, password: string, name?: string) {
  return request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  })
}

export async function login(email: string, password: string) {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function logout() {
  return request<{ message: string }>('/auth/logout', {
    method: 'POST',
  })
}

export async function getMe() {
  return request<{ user: User }>('/auth/me')
}

// ============================================
// Tipos de Monitors
// ============================================

export interface Monitor {
  id: string
  name: string
  url: string
  method: string
  intervalSeconds: number
  timeout: number
  expectedStatus: number
  checkSsl: boolean
  active: boolean
  alertsEnabled: boolean
  createdAt: string
  updatedAt: string
  userId: string
  currentStatus?: 'up' | 'down' | 'degraded' | 'unknown'
  lastCheck?: string
  lastLatency?: number
  uptimePercentage?: number
}

export interface MonitorListResponse {
  monitors: Monitor[]
  total: number
  limit: number
  offset: number
}

export interface CreateMonitorData {
  name: string
  url: string
  method?: 'GET' | 'POST' | 'HEAD'
  intervalSeconds?: number
  timeout?: number
  expectedStatus?: number
  checkSsl?: boolean
  active?: boolean
  alertsEnabled?: boolean
}

export interface UpdateMonitorData {
  name?: string
  url?: string
  method?: 'GET' | 'POST' | 'HEAD'
  intervalSeconds?: number
  timeout?: number
  expectedStatus?: number
  checkSsl?: boolean
  active?: boolean
  alertsEnabled?: boolean
}

// ============================================
// Funções de Monitors
// ============================================

export async function getMonitors(params?: { active?: boolean; limit?: number; offset?: number }) {
  const searchParams = new URLSearchParams()
  if (params?.active !== undefined) searchParams.set('active', String(params.active))
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.offset) searchParams.set('offset', String(params.offset))

  const query = searchParams.toString()
  return request<MonitorListResponse>(`/monitors${query ? `?${query}` : ''}`)
}

export async function getMonitor(id: string) {
  return request<Monitor>(`/monitors/${id}`)
}

export async function createMonitor(data: CreateMonitorData) {
  return request<Monitor>('/monitors', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateMonitor(id: string, data: UpdateMonitorData) {
  return request<Monitor>(`/monitors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteMonitor(id: string) {
  return request<void>(`/monitors/${id}`, {
    method: 'DELETE',
  })
}

// ============================================
// Tipos de Alert Channels
// ============================================

export interface AlertChannel {
  id: string
  name: string
  type: 'email' | 'webhook' | 'slack'
  config: Record<string, string>
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface AlertChannelListResponse {
  channels: AlertChannel[]
  total: number
  limit: number
  offset: number
}

export interface CreateAlertChannelData {
  name: string
  type: 'email' | 'webhook' | 'slack'
  config: Record<string, string>
  active?: boolean
}

export interface UpdateAlertChannelData {
  name?: string
  config?: Record<string, string>
  active?: boolean
}

// ============================================
// Funções de Alert Channels
// ============================================

export async function getAlertChannels(params?: { active?: boolean; type?: string; limit?: number; offset?: number }) {
  const searchParams = new URLSearchParams()
  if (params?.active !== undefined) searchParams.set('active', String(params.active))
  if (params?.type) searchParams.set('type', params.type)
  if (params?.limit) searchParams.set('limit', String(params.limit))
  if (params?.offset) searchParams.set('offset', String(params.offset))

  const query = searchParams.toString()
  return request<AlertChannelListResponse>(`/alerts/channels${query ? `?${query}` : ''}`)
}

export async function getAlertChannel(id: string) {
  return request<AlertChannel>(`/alerts/channels/${id}`)
}

export async function createAlertChannel(data: CreateAlertChannelData) {
  return request<AlertChannel>('/alerts/channels', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateAlertChannel(id: string, data: UpdateAlertChannelData) {
  return request<AlertChannel>(`/alerts/channels/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteAlertChannel(id: string) {
  return request<void>(`/alerts/channels/${id}`, {
    method: 'DELETE',
  })
}
