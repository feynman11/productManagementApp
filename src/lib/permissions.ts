import type { OrgRole } from '../generated/prisma/client/enums'

const ROLE_HIERARCHY: Record<OrgRole, number> = {
  ADMIN: 3,
  CONTRIBUTOR: 2,
  VIEWER: 1,
}

export function hasPermission(
  userRole: OrgRole | undefined,
  requiredRole: OrgRole,
): boolean {
  if (!userRole) return false
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export function canWrite(role: OrgRole | undefined, isDemo?: boolean): boolean {
  if (isDemo) return false
  return hasPermission(role, 'CONTRIBUTOR')
}

export function canAdmin(role: OrgRole | undefined, isDemo?: boolean): boolean {
  if (isDemo) return false
  return hasPermission(role, 'ADMIN')
}
