import type { OrgRole, ProductMemberRole } from '../generated/prisma/client/enums'

// ──────────────────────────────────────────────────────
// Org-level permissions (unchanged)
// ──────────────────────────────────────────────────────

const ROLE_HIERARCHY: Record<OrgRole, number> = {
  ADMIN: 3,
  CONTRIBUTOR: 2,
  VIEWER: 1,
}

function hasPermission(
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

// ──────────────────────────────────────────────────────
// Product-level permissions
// ──────────────────────────────────────────────────────

export type EffectiveProductRole = ProductMemberRole

const PRODUCT_ROLE_HIERARCHY: Record<ProductMemberRole, number> = {
  OWNER: 3,
  MEMBER: 2,
  VIEWER: 1,
}

/**
 * Resolve the effective product role, accounting for org-level overrides.
 * Org ADMINs and super admins are always treated as OWNER.
 * Org members without a ProductMember record get VIEWER.
 */
export function resolveProductRole(opts: {
  orgRole: OrgRole
  productRole: ProductMemberRole | null
  isSuperAdmin?: boolean
  isDemo?: boolean
}): EffectiveProductRole {
  if (opts.isDemo) return 'VIEWER'
  if (opts.isSuperAdmin) return 'OWNER'
  if (opts.orgRole === 'ADMIN') return 'OWNER'
  if (opts.productRole) return opts.productRole
  // Org member with no product membership -> VIEWER
  return 'VIEWER'
}

/** OWNER only: edit product settings, manage members, manage releases, change idea status, convert ideas */
export function canProductAdmin(role: EffectiveProductRole | null): boolean {
  if (!role) return false
  return PRODUCT_ROLE_HIERARCHY[role] >= PRODUCT_ROLE_HIERARCHY['OWNER']
}

/** MEMBER+: create/update features, issues, edit ideas (RICE), comment on issues/features */
export function canProductWrite(role: EffectiveProductRole | null): boolean {
  if (!role) return false
  return PRODUCT_ROLE_HIERARCHY[role] >= PRODUCT_ROLE_HIERARCHY['MEMBER']
}

/** VIEWER+: create ideas, comment on ideas, vote on ideas */
export function canProductContribute(role: EffectiveProductRole | null): boolean {
  if (!role) return false
  return PRODUCT_ROLE_HIERARCHY[role] >= PRODUCT_ROLE_HIERARCHY['VIEWER']
}
