import { describe, it, expect } from 'vitest'

// Test NotificationType enum values and their coverage
const NOTIFICATION_TYPES = [
  'IDEA_VOTED',
  'IDEA_STATUS_CHANGED',
  'IDEA_COMMENTED',
  'ISSUE_ASSIGNED',
  'ISSUE_COMMENTED',
] as const

type NotificationType = (typeof NOTIFICATION_TYPES)[number]

describe('Notification Types', () => {
  it('should have exactly 5 notification types', () => {
    expect(NOTIFICATION_TYPES).toHaveLength(5)
  })

  it('should include all idea-related types', () => {
    const ideaTypes = NOTIFICATION_TYPES.filter((t) => t.startsWith('IDEA_'))
    expect(ideaTypes).toEqual(['IDEA_VOTED', 'IDEA_STATUS_CHANGED', 'IDEA_COMMENTED'])
  })

  it('should include all issue-related types', () => {
    const issueTypes = NOTIFICATION_TYPES.filter((t) => t.startsWith('ISSUE_'))
    expect(issueTypes).toEqual(['ISSUE_ASSIGNED', 'ISSUE_COMMENTED'])
  })

  it('should use SCREAMING_SNAKE_CASE format', () => {
    for (const type of NOTIFICATION_TYPES) {
      expect(type).toMatch(/^[A-Z_]+$/)
    }
  })

  describe('type guard', () => {
    function isValidNotificationType(value: string): value is NotificationType {
      return (NOTIFICATION_TYPES as readonly string[]).includes(value)
    }

    it('should accept valid types', () => {
      expect(isValidNotificationType('IDEA_VOTED')).toBe(true)
      expect(isValidNotificationType('ISSUE_ASSIGNED')).toBe(true)
    })

    it('should reject invalid types', () => {
      expect(isValidNotificationType('INVALID')).toBe(false)
      expect(isValidNotificationType('idea_voted')).toBe(false)
      expect(isValidNotificationType('')).toBe(false)
    })
  })
})

describe('Notification Message Formatting', () => {
  function formatNotificationMessage(
    type: NotificationType,
    entityTitle: string,
    actorName?: string,
  ): string {
    switch (type) {
      case 'IDEA_VOTED':
        return `${actorName ?? 'Someone'} voted for "${entityTitle}"`
      case 'IDEA_STATUS_CHANGED':
        return `"${entityTitle}" status was updated`
      case 'IDEA_COMMENTED':
        return `${actorName ?? 'Someone'} commented on "${entityTitle}"`
      case 'ISSUE_ASSIGNED':
        return `You were assigned to "${entityTitle}"`
      case 'ISSUE_COMMENTED':
        return `${actorName ?? 'Someone'} commented on "${entityTitle}"`
    }
  }

  it('should format idea vote notification', () => {
    expect(formatNotificationMessage('IDEA_VOTED', 'Add dark mode')).toBe(
      'Someone voted for "Add dark mode"',
    )
  })

  it('should format with actor name', () => {
    expect(formatNotificationMessage('IDEA_VOTED', 'Add dark mode', 'Alice')).toBe(
      'Alice voted for "Add dark mode"',
    )
  })

  it('should format issue assignment', () => {
    expect(formatNotificationMessage('ISSUE_ASSIGNED', 'Bug #42')).toBe(
      'You were assigned to "Bug #42"',
    )
  })

  it('should format all types without error', () => {
    for (const type of NOTIFICATION_TYPES) {
      const msg = formatNotificationMessage(type, 'Test Entity')
      expect(msg).toBeTruthy()
      expect(msg.length).toBeGreaterThan(0)
    }
  })
})
