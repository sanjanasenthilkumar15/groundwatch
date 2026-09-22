import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api, Officer } from './api'

export type Role = 'district' | 'block' | 'agriculture' | 'admin' | null

export const ROUTE_BY_ROLE: Record<string, string> = {
  district: '/dashboard',
  block: '/block-dashboard',
  agriculture: '/agriculture',
  admin: '/admin',
}

interface RoleContextType {
  role: Role
  officer: Officer | null
  loading: boolean
  login: (username: string, password: string) => Promise<Officer>
  logout: () => void
}

const RoleContext = createContext<RoleContextType>({
  role: null,
  officer: null,
  loading: true,
  login: async () => { throw new Error('RoleProvider not mounted') },
  logout: () => {},
})

export function RoleProvider({ children }: { children: ReactNode }) {
  const [officer, setOfficer] = useState<Officer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('gw_token')
    if (!token) {
      setLoading(false)
      return
    }
    api.officerMe()
      .then(res => setOfficer(res.officer))
      .catch(() => localStorage.removeItem('gw_token'))
      .finally(() => setLoading(false))
  }, [])

  const login = async (username: string, password: string) => {
    const res = await api.officerLogin(username, password)
    localStorage.setItem('gw_token', res.token)
    setOfficer(res.officer)
    return res.officer
  }

  const logout = () => {
    localStorage.removeItem('gw_token')
    setOfficer(null)
  }

  const role = (officer?.role ?? null) as Role

  return (
    <RoleContext.Provider value={{ role, officer, loading, login, logout }}>
      {children}
    </RoleContext.Provider>
  )
}

export const useRole = () => useContext(RoleContext)
