import type { ClientUserRole } from '../generated/prisma/client/enums'

const ROLE_HIERARCHY: Record<ClientUserRole, number> = {
  CLIENT_ADMIN: 3,
  CLIENT_USER: 2,
  CLIENT_VIEWER: 1,
}

export function hasPermission(
  userRole: ClientUserRole | undefined,
  requiredRole: ClientUserRole,
): boolean {
  if (!userRole) return false
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export function canWrite(role: ClientUserRole | undefined): boolean {
  return hasPermission(role, 'CLIENT_USER')
}

export function canAdmin(role: ClientUserRole | undefined): boolean {
  return hasPermission(role, 'CLIENT_ADMIN')
}
