import { describe, it, expect } from 'vitest'
import { hasPermission, canWrite, canAdmin } from '~/lib/permissions'

describe('Permission System', () => {
  describe('hasPermission', () => {
    it('CLIENT_ADMIN should have all permissions', () => {
      expect(hasPermission('CLIENT_ADMIN', 'CLIENT_ADMIN')).toBe(true)
      expect(hasPermission('CLIENT_ADMIN', 'CLIENT_USER')).toBe(true)
      expect(hasPermission('CLIENT_ADMIN', 'CLIENT_VIEWER')).toBe(true)
    })

    it('CLIENT_USER should not have admin permissions', () => {
      expect(hasPermission('CLIENT_USER', 'CLIENT_ADMIN')).toBe(false)
      expect(hasPermission('CLIENT_USER', 'CLIENT_USER')).toBe(true)
      expect(hasPermission('CLIENT_USER', 'CLIENT_VIEWER')).toBe(true)
    })

    it('CLIENT_VIEWER should only have viewer permissions', () => {
      expect(hasPermission('CLIENT_VIEWER', 'CLIENT_ADMIN')).toBe(false)
      expect(hasPermission('CLIENT_VIEWER', 'CLIENT_USER')).toBe(false)
      expect(hasPermission('CLIENT_VIEWER', 'CLIENT_VIEWER')).toBe(true)
    })

    it('undefined role should have no permissions', () => {
      expect(hasPermission(undefined, 'CLIENT_ADMIN')).toBe(false)
      expect(hasPermission(undefined, 'CLIENT_USER')).toBe(false)
      expect(hasPermission(undefined, 'CLIENT_VIEWER')).toBe(false)
    })
  })

  describe('canWrite', () => {
    it('should return true for CLIENT_ADMIN', () => {
      expect(canWrite('CLIENT_ADMIN')).toBe(true)
    })

    it('should return true for CLIENT_USER', () => {
      expect(canWrite('CLIENT_USER')).toBe(true)
    })

    it('should return false for CLIENT_VIEWER', () => {
      expect(canWrite('CLIENT_VIEWER')).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(canWrite(undefined)).toBe(false)
    })
  })

  describe('canAdmin', () => {
    it('should return true for CLIENT_ADMIN', () => {
      expect(canAdmin('CLIENT_ADMIN')).toBe(true)
    })

    it('should return false for CLIENT_USER', () => {
      expect(canAdmin('CLIENT_USER')).toBe(false)
    })

    it('should return false for CLIENT_VIEWER', () => {
      expect(canAdmin('CLIENT_VIEWER')).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(canAdmin(undefined)).toBe(false)
    })
  })
})
