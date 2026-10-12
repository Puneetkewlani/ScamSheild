import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { AuthPage } from './components/AuthPage'

const mocks = vi.hoisted(() => ({
  auth: { user: null as null | { id: string; fullName: string; email: string; role: 'USER'; createdAt: string }, loading: false, login: vi.fn(), register: vi.fn(), logout: vi.fn() },
  api: { login: vi.fn(), register: vi.fn(), me: vi.fn(), history: vi.fn(), summary: vi.fn(), createScan: vi.fn(), forgotPassword: vi.fn(), resetPassword: vi.fn() },
}))

vi.mock('./services/useAuth', () => ({ useAuth: () => mocks.auth }))
vi.mock('./services/apiClient', () => ({
  api: mocks.api,
  ApiError: class ApiError extends Error { status = 400 },
}))

afterEach(() => {
  vi.clearAllMocks()
  mocks.auth.user = null
  mocks.auth.loading = false
  mocks.api.history.mockResolvedValue([])
  mocks.api.summary.mockResolvedValue({ scanCount: 0, lowCount: 0, mediumCount: 0, highCount: 0, recentActivity: [] })
})

describe('authentication UI', () => {
  it('shows inline validation instead of submitting an invalid email', async () => {
    render(<MemoryRouter initialEntries={['/login']}><AuthPage /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'not-an-email' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'something' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect((await screen.findByRole('alert')).textContent).toContain('valid email')
    expect(mocks.auth.login).not.toHaveBeenCalled()
  })

  it('requires agreement before creating an account', async () => {
    render(<MemoryRouter initialEntries={['/register']}><AuthPage /></MemoryRouter>)
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Sam User' } })
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'sam@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'StrongPass!1234' } })
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'StrongPass!1234' } })
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect((await screen.findByRole('alert')).textContent).toContain('Accept the Terms')
    expect(mocks.auth.register).not.toHaveBeenCalled()
  })

  it('renders the sign-in screen for unauthenticated protected locations', () => {
    render(<MemoryRouter initialEntries={['/history']}><App /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Welcome back.' })).toBeTruthy()
  })

  it('redirects an authenticated visitor away from the registration page', async () => {
    mocks.auth.user = { id: 'user-1', fullName: 'Sam User', email: 'sam@example.com', role: 'USER', createdAt: new Date().toISOString() }
    mocks.api.history.mockResolvedValue([])
    mocks.api.summary.mockResolvedValue({ scanCount: 0, lowCount: 0, mediumCount: 0, highCount: 0, recentActivity: [] })
    render(<MemoryRouter initialEntries={['/register']}><App /></MemoryRouter>)

    expect((await screen.findByRole('button', { name: 'Overview' })).getAttribute('aria-current')).toBe('page')
    await waitFor(() => expect(mocks.api.history).toHaveBeenCalled())
  })
})