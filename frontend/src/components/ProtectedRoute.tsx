import { ReactElement } from 'react'
import { Navigate } from 'react-router-dom'
import { useRole, ROUTE_BY_ROLE, Role } from '../lib/RoleContext'

interface Props {
  children: ReactElement
  allow?: Role[]
}

export default function ProtectedRoute({ children, allow }: Props) {
  const { role, loading } = useRole()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-secondary font-ui text-sm">
        Loading…
      </div>
    )
  }

  if (!role) {
    return <Navigate to="/login" replace />
  }

  if (allow && !allow.includes(role)) {
    return <Navigate to={ROUTE_BY_ROLE[role] ?? '/login'} replace />
  }

  return children
}
