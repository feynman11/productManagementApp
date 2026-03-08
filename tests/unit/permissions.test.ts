import { describe, it, expect } from 'vitest'
import { hasPermission, canWrite, canAdmin } from '~/lib/permissions'

describe('Permission System', () => {
  describe('hasPermission', () => {
    it('ADMIN should have all permissions', () => {
      expect(hasPermission('ADMIN', 'ADMIN')).toBe(true)
      expect(hasPermission('ADMIN', 'CONTRIBUTOR')).toBe(true)
      expect(hasPermission('ADMIN', 'VIEWER')).toBe(true)
    })

    it('CONTRIBUTOR should not have admin permissions', () => {
      expect(hasPermission('CONTRIBUTOR', 'ADMIN')).toBe(false)
      expect(hasPermission('CONTRIBUTOR', 'CONTRIBUTOR')).toBe(true)
      expect(hasPermission('CONTRIBUTOR', 'VIEWER')).toBe(true)
    })

    it('VIEWER should only have viewer permissions', () => {
      expect(hasPermission('VIEWER', 'ADMIN')).toBe(false)
      expect(hasPermission('VIEWER', 'CONTRIBUTOR')).toBe(false)
      expect(hasPermission('VIEWER', 'VIEWER')).toBe(true)
    })

    it('undefined role should have no permissions', () => {
      expect(hasPermission(undefined, 'ADMIN')).toBe(false)
      expect(hasPermission(undefined, 'CONTRIBUTOR')).toBe(false)
      expect(hasPermission(undefined, 'VIEWER')).toBe(false)
    })
  })

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
