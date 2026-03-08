import { describe, it, expect } from 'vitest'
import {
  canWrite,
  canAdmin,
  resolveProductRole,
  canProductAdmin,
  canProductWrite,
  canProductContribute,
} from '~/lib/permissions'

describe('Org-Level Permissions', () => {
  describe('canWrite', () => {
    it('should return true for ADMIN', () => {
      expect(canWrite('ADMIN')).toBe(true)
    })

    it('should return true for CONTRIBUTOR', () => {
      expect(canWrite('CONTRIBUTOR')).toBe(true)
    })

    it('should return false for VIEWER', () => {
      expect(canWrite('VIEWER')).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(canWrite(undefined)).toBe(false)
    })

    it('should return false for demo org regardless of role', () => {
      expect(canWrite('ADMIN', true)).toBe(false)
      expect(canWrite('CONTRIBUTOR', true)).toBe(false)
    })
  })

  describe('canAdmin', () => {
    it('should return true for ADMIN', () => {
      expect(canAdmin('ADMIN')).toBe(true)
    })

    it('should return false for CONTRIBUTOR', () => {
      expect(canAdmin('CONTRIBUTOR')).toBe(false)
    })

    it('should return false for VIEWER', () => {
      expect(canAdmin('VIEWER')).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(canAdmin(undefined)).toBe(false)
    })

    it('should return false for demo org regardless of role', () => {
      expect(canAdmin('ADMIN', true)).toBe(false)
    })
  })
})

describe('Product-Level Permissions', () => {
  describe('resolveProductRole', () => {
    it('super admin always gets OWNER', () => {
      expect(resolveProductRole({ orgRole: 'VIEWER', productRole: null, isSuperAdmin: true })).toBe('OWNER')
      expect(resolveProductRole({ orgRole: 'VIEWER', productRole: 'VIEWER', isSuperAdmin: true })).toBe('OWNER')
    })

    it('org ADMIN always gets OWNER', () => {
      expect(resolveProductRole({ orgRole: 'ADMIN', productRole: null })).toBe('OWNER')
      expect(resolveProductRole({ orgRole: 'ADMIN', productRole: 'VIEWER' })).toBe('OWNER')
    })

    it('demo org always gets VIEWER', () => {
      expect(resolveProductRole({ orgRole: 'ADMIN', productRole: 'OWNER', isDemo: true })).toBe('VIEWER')
    })

    it('uses explicit product role when set', () => {
      expect(resolveProductRole({ orgRole: 'CONTRIBUTOR', productRole: 'OWNER' })).toBe('OWNER')
      expect(resolveProductRole({ orgRole: 'CONTRIBUTOR', productRole: 'MEMBER' })).toBe('MEMBER')
      expect(resolveProductRole({ orgRole: 'CONTRIBUTOR', productRole: 'VIEWER' })).toBe('VIEWER')
    })

    it('org member with no product role gets VIEWER', () => {
      expect(resolveProductRole({ orgRole: 'CONTRIBUTOR', productRole: null })).toBe('VIEWER')
      expect(resolveProductRole({ orgRole: 'VIEWER', productRole: null })).toBe('VIEWER')
    })
  })

  describe('canProductAdmin', () => {
    it('OWNER can admin', () => {
      expect(canProductAdmin('OWNER')).toBe(true)
    })

    it('MEMBER cannot admin', () => {
      expect(canProductAdmin('MEMBER')).toBe(false)
    })

    it('VIEWER cannot admin', () => {
      expect(canProductAdmin('VIEWER')).toBe(false)
    })

    it('null cannot admin', () => {
      expect(canProductAdmin(null)).toBe(false)
    })
  })

  describe('canProductWrite', () => {
    it('OWNER can write', () => {
      expect(canProductWrite('OWNER')).toBe(true)
    })

    it('MEMBER can write', () => {
      expect(canProductWrite('MEMBER')).toBe(true)
    })

    it('VIEWER cannot write', () => {
      expect(canProductWrite('VIEWER')).toBe(false)
    })

    it('null cannot write', () => {
      expect(canProductWrite(null)).toBe(false)
    })
  })

  describe('canProductContribute', () => {
    it('OWNER can contribute', () => {
      expect(canProductContribute('OWNER')).toBe(true)
    })

    it('MEMBER can contribute', () => {
      expect(canProductContribute('MEMBER')).toBe(true)
    })

    it('VIEWER can contribute', () => {
      expect(canProductContribute('VIEWER')).toBe(true)
    })

    it('null cannot contribute', () => {
      expect(canProductContribute(null)).toBe(false)
    })
  })
})
