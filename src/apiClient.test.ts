import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from './services/apiClient'

afterEach(() => vi.unstubAllGlobals())

describe('API availability feedback', () => {
  it('explains that the backend and database must be started when the proxy is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 502 }))

    await expect(api.login('person@example.com', 'StrongPass!1234'))
      .rejects.toThrow('Start the Spring Boot backend with Firebase credentials configured')
  })
})