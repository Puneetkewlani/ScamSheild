import type { ScanInput, ScanRecord, ScanType, RiskLevel } from '../types'

export interface UserProfile {
  id: string
  fullName: string
  email: string
  role: 'USER' | 'ADMIN'
  createdAt: string
}

export interface DashboardSummary {
  scanCount: number
  lowCount: number
  mediumCount: number
  highCount: number
  recentActivity: ApiScan[]
}

interface ApiFinding {
  category: string
  title: string
  explanation: string
  status: string
}

interface ApiScan {
  id: string
  content: string
  type: string
  createdAt: string
  score: number | null
  risk: string
  summary: string
  findings: ApiFinding[]
  recommendations: string[]
  demo: boolean
}

interface ApiPage<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''
let csrfToken: string | null = null

async function fetchApi(path: string, init?: RequestInit) {
  try {
    return await fetch(`${baseUrl}${path}`, { ...init, credentials: 'include' })
  } catch {
    throw new ApiError('ScamShield API is unreachable. Start the Spring Boot backend with Firebase credentials configured, then retry.', 0)
  }
}

async function getCsrfToken() {
  if (csrfToken) return csrfToken
  const response = await fetchApi('/api/auth/csrf')
  if (!response.ok) {
    const message = response.status >= 500
      ? 'ScamShield API is unavailable. Start the Spring Boot backend with Firebase credentials configured, then retry.'
      : 'Could not start a secure session. Refresh the page and try again.'
    throw new ApiError(message, response.status)
  }
  csrfToken = (await response.json() as { token: string }).token
  return csrfToken
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase()
  const headers = new Headers(init.headers)
  if (init.body) headers.set('Content-Type', 'application/json')
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) headers.set('X-XSRF-TOKEN', await getCsrfToken())
  const response = await fetchApi(path, { ...init, method, headers })
  if (response.status === 204) return undefined as T
  const body = await response.json().catch(() => null) as { message?: string } | null
  if (!response.ok) {
    if (response.status === 403) csrfToken = null
    throw new ApiError(body?.message ?? 'The request could not be completed.', response.status)
  }
  return body as T
}

function toScanRecord(scan: ApiScan): ScanRecord {
  const type: ScanType = scan.type === 'EMAIL' ? 'Email' : scan.type as ScanType
  const risk: RiskLevel = scan.risk === 'medium' ? 'suspicious' : scan.risk as RiskLevel
  return {
    id: scan.id,
    content: scan.content,
    type,
    createdAt: scan.createdAt,
    score: scan.score ?? 0,
    risk,
    summary: scan.summary,
    findings: scan.findings.map((finding) => ({
      category: finding.category,
      title: finding.title,
      explanation: finding.explanation,
      status: finding.status.toLowerCase() as ScanRecord['findings'][number]['status'],
    })),
    recommendations: scan.recommendations,
    demo: true,
  }
}

export const api = {
  me: () => request<UserProfile>('/api/auth/me'),
  async login(email: string, password: string) {
    csrfToken = null
    const response = await request<{ user: UserProfile }>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
    csrfToken = null
    return response.user
  },
  register: (fullName: string, email: string, password: string, passwordConfirmation: string) =>
    request<{ user: UserProfile }>('/api/auth/register', { method: 'POST', body: JSON.stringify({ fullName, email, password, passwordConfirmation }) }),
  async logout() {
    await request<void>('/api/auth/logout', { method: 'POST' })
    csrfToken = null
  },
  forgotPassword: (email: string) => request<{ message: string }>('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) => request<{ message: string }>('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
  async createScan(input: ScanInput) {
    const type = input.type === 'Email' ? 'EMAIL' : input.type.toUpperCase()
    const scan = await request<ApiScan>('/api/scans', { method: 'POST', body: JSON.stringify({ type, content: input.content }) })
    return toScanRecord(scan)
  },
  async history() {
    const result = await request<ApiPage<ApiScan>>('/api/scans?page=0&size=100&sort=recent')
    return result.content.map(toScanRecord)
  },
  summary: () => request<DashboardSummary>('/api/dashboard/summary'),
}