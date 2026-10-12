import { useEffect, useState, type ReactNode } from 'react'
import { api, type UserProfile } from './apiClient'
import { AuthContext } from './authContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.me().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false))
  }, [])

  async function login(email: string, password: string) {
    setUser(await api.login(email, password))
  }

  async function register(name: string, email: string, password: string, confirmation: string) {
    await api.register(name, email, password, confirmation)
  }

  async function logout() {
    await api.logout()
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
}