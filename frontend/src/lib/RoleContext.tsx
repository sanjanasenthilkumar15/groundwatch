import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Role = 'district' | 'block' | 'agriculture' | 'farmer' | null

interface RoleContextType {
  role: Role
  setRole: (r: Role) => void
}

const RoleContext = createContext<RoleContextType>({ role: null, setRole: () => {} })

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(() => {
    return (localStorage.getItem('gw_role') as Role) ?? null
  })

  const setRole = (r: Role) => {
    if (r) localStorage.setItem('gw_role', r)
    else localStorage.removeItem('gw_role')
    setRoleState(r)
  }

  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>
}

export const useRole = () => useContext(RoleContext)
