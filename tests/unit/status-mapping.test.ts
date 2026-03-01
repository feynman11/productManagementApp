import { describe, it, expect } from 'vitest'

// Replicate status-to-variant mapping used for badge styling
// This maps statuses from various enums (ProductStatus, IdeaStatus, IssueStatus,
// IssueSeverity, RoadmapItemStatus) to badge color variants
function getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'info' | 'default' {
  const statusUpper = status.toUpperCase()
  if (['ACTIVE', 'COMPLETED', 'RELEASED', 'RESOLVED', 'CLOSED'].includes(statusUpper)) return 'success'
  if (['IN_PROGRESS'].includes(statusUpper)) return 'warning'
  if (['CRITICAL', 'OPEN', 'SUSPENDED'].includes(statusUpper)) return 'danger'
  if (['DRAFT', 'PLANNED', 'BACKLOG', 'SUBMITTED', 'UNDER_REVIEW'].includes(statusUpper)) return 'info'
  return 'default'
}

describe('Status Badge Mapping', () => {
  describe('Success variants (green)', () => {
    it('should map ACTIVE to success', () => {
      expect(getStatusVariant('ACTIVE')).toBe('success')
    })

    it('should map COMPLETED to success', () => {
      expect(getStatusVariant('COMPLETED')).toBe('success')
    })

    it('should map RELEASED to success', () => {
      expect(getStatusVariant('RELEASED')).toBe('success')
    })

    it('should map RESOLVED to success', () => {
      expect(getStatusVariant('RESOLVED')).toBe('success')
    })

    it('should map CLOSED to success', () => {
      expect(getStatusVariant('CLOSED')).toBe('success')
    })
  })

  describe('Warning variants (yellow/amber)', () => {
    it('should map IN_PROGRESS to warning', () => {
      expect(getStatusVariant('IN_PROGRESS')).toBe('warning')
    })
  })

  describe('Danger variants (red)', () => {
    it('should map CRITICAL to danger', () => {
      expect(getStatusVariant('CRITICAL')).toBe('danger')
    })

    it('should map OPEN to danger', () => {
      expect(getStatusVariant('OPEN')).toBe('danger')
    })

    it('should map SUSPENDED to danger', () => {
      expect(getStatusVariant('SUSPENDED')).toBe('danger')
    })
  })

  describe('Info variants (blue)', () => {
    it('should map DRAFT to info', () => {
      expect(getStatusVariant('DRAFT')).toBe('info')
    })

    it('should map PLANNED to info', () => {
      expect(getStatusVariant('PLANNED')).toBe('info')
    })

    it('should map BACKLOG to info', () => {
      expect(getStatusVariant('BACKLOG')).toBe('info')
    })

    it('should map SUBMITTED to info', () => {
      expect(getStatusVariant('SUBMITTED')).toBe('info')
    })

    it('should map UNDER_REVIEW to info', () => {
      expect(getStatusVariant('UNDER_REVIEW')).toBe('info')
    })
  })

  describe('Default variant (fallback)', () => {
    it('should map unknown statuses to default', () => {
      expect(getStatusVariant('UNKNOWN')).toBe('default')
    })

    it('should map REJECTED to default', () => {
      expect(getStatusVariant('REJECTED')).toBe('default')
    })

    it('should map DUPLICATE to default', () => {
      expect(getStatusVariant('DUPLICATE')).toBe('default')
    })

    it('should map ARCHIVED to default', () => {
      expect(getStatusVariant('ARCHIVED')).toBe('default')
    })

    it('should map empty string to default', () => {
      expect(getStatusVariant('')).toBe('default')
    })
  })

  describe('Case insensitivity', () => {
    it('should handle lowercase input', () => {
      expect(getStatusVariant('active')).toBe('success')
    })

    it('should handle mixed case input', () => {
      expect(getStatusVariant('In_Progress')).toBe('warning')
    })

    it('should handle all lowercase with underscore', () => {
      expect(getStatusVariant('under_review')).toBe('info')
    })
  })

  describe('IdeaStatus enum coverage', () => {
    it('should map all IdeaStatus values correctly', () => {
      expect(getStatusVariant('SUBMITTED')).toBe('info')
      expect(getStatusVariant('UNDER_REVIEW')).toBe('info')
      expect(getStatusVariant('PLANNED')).toBe('info')
      expect(getStatusVariant('IN_PROGRESS')).toBe('warning')
      expect(getStatusVariant('COMPLETED')).toBe('success')
      expect(getStatusVariant('REJECTED')).toBe('default')
      expect(getStatusVariant('DUPLICATE')).toBe('default')
    })
  })

  describe('IssueStatus enum coverage', () => {
    it('should map all IssueStatus values correctly', () => {
      expect(getStatusVariant('OPEN')).toBe('danger')
      expect(getStatusVariant('IN_PROGRESS')).toBe('warning')
      expect(getStatusVariant('RESOLVED')).toBe('success')
      expect(getStatusVariant('CLOSED')).toBe('success')
    })
  })

  describe('IssueSeverity values', () => {
    it('should map CRITICAL severity to danger', () => {
      expect(getStatusVariant('CRITICAL')).toBe('danger')
    })

    it('should map HIGH severity to default (uses separate severity badge)', () => {
      expect(getStatusVariant('HIGH')).toBe('default')
    })

    it('should map MEDIUM severity to default (uses separate severity badge)', () => {
      expect(getStatusVariant('MEDIUM')).toBe('default')
    })

    it('should map LOW severity to default (uses separate severity badge)', () => {
      expect(getStatusVariant('LOW')).toBe('default')
    })
  })

  describe('RoadmapItemStatus enum coverage', () => {
    it('should map all RoadmapItemStatus values correctly', () => {
      expect(getStatusVariant('BACKLOG')).toBe('info')
      expect(getStatusVariant('PLANNED')).toBe('info')
      expect(getStatusVariant('IN_PROGRESS')).toBe('warning')
      expect(getStatusVariant('COMPLETED')).toBe('success')
      expect(getStatusVariant('RELEASED')).toBe('success')
    })
  })

  describe('ClientStatus enum coverage', () => {
    it('should map ACTIVE client status to success', () => {
      expect(getStatusVariant('ACTIVE')).toBe('success')
    })

    it('should map SUSPENDED client status to danger', () => {
      expect(getStatusVariant('SUSPENDED')).toBe('danger')
    })
  })
})
