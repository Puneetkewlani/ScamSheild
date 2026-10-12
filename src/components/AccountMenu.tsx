import { useState } from 'react'
import { ChevronDown, LogOut, Settings } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { DashboardSummary } from '../services/apiClient'
import { useAuth } from '../services/useAuth'

export function AccountMenu({ summary }: { summary: DashboardSummary | null }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  if (!user) return null
  const initials = user.fullName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')

  async function signOut() {
    try {
      await logout()
      navigate('/login', { replace: true })
    } catch {
      setOpen(false)
    }
  }

  return <div className="account-auth-anchor">
    <button className="account-auth-trigger" type="button" aria-expanded={open} onClick={() => setOpen(!open)}>
      <span className="account-auth-avatar">{initials}</span>
      <span className="account-auth-copy"><strong>{user.fullName}</strong><small>{user.email}</small></span>
      <ChevronDown size={14} />
    </button>
    {open && <div className="account-auth-menu"><div className="account-auth-detail"><strong>{user.fullName}</strong><span>{user.email}</span><small>{summary?.scanCount ?? 0} saved scans</small><small>{summary?.lowCount ?? 0} low · {summary?.mediumCount ?? 0} medium · {summary?.highCount ?? 0} high risk</small></div><button type="button" onClick={() => { navigate('/'); setOpen(false) }}><Settings size={15} /> Workspace</button><button type="button" onClick={signOut}><LogOut size={15} /> Sign out</button></div>}
  </div>
}