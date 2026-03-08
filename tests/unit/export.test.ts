import { describe, it, expect } from 'vitest'

// Test the CSV utility functions directly (they're inline in export.ts server functions,
// so we replicate the logic here for unit testing)

function escapeCsvField(value: string | number | null | undefined): string {
  if (value == null) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function toCsvRow(fields: Array<string | number | null | undefined>): string {
  return fields.map(escapeCsvField).join(',')
}

describe('CSV Export Utilities', () => {
  describe('escapeCsvField()', () => {
    it('should return empty string for null', () => {
      expect(escapeCsvField(null)).toBe('')
    })

    it('should return empty string for undefined', () => {
      expect(escapeCsvField(undefined)).toBe('')
    })

    it('should return plain string for simple values', () => {
      expect(escapeCsvField('hello')).toBe('hello')
    })

    it('should convert numbers to strings', () => {
      expect(escapeCsvField(42)).toBe('42')
      expect(escapeCsvField(3.14)).toBe('3.14')
      expect(escapeCsvField(0)).toBe('0')
    })

    it('should wrap values with commas in quotes', () => {
      expect(escapeCsvField('hello, world')).toBe('"hello, world"')
    })

    it('should wrap values with quotes in double quotes', () => {
      expect(escapeCsvField('say "hello"')).toBe('"say ""hello"""')
    })

    it('should wrap values with newlines in quotes', () => {
      expect(escapeCsvField('line1\nline2')).toBe('"line1\nline2"')
    })

    it('should wrap values with carriage returns in quotes', () => {
      expect(escapeCsvField('line1\rline2')).toBe('"line1\rline2"')
    })

    it('should handle values with multiple special characters', () => {
      expect(escapeCsvField('a "b", c\nd')).toBe('"a ""b"", c\nd"')
    })

    it('should handle empty string', () => {
      expect(escapeCsvField('')).toBe('')
    })
  })

  describe('toCsvRow()', () => {
    it('should join fields with commas', () => {
      expect(toCsvRow(['a', 'b', 'c'])).toBe('a,b,c')
    })

    it('should handle mixed types', () => {
      expect(toCsvRow(['name', 42, null, undefined])).toBe('name,42,,')
    })

    it('should escape fields that need it', () => {
      expect(toCsvRow(['normal', 'has, comma', 'has "quote"'])).toBe(
        'normal,"has, comma","has ""quote"""',
      )
    })

    it('should handle single field', () => {
      expect(toCsvRow(['only'])).toBe('only')
    })

    it('should handle empty array', () => {
      expect(toCsvRow([])).toBe('')
    })

    it('should handle all null fields', () => {
      expect(toCsvRow([null, null, null])).toBe(',,')
    })
  })

  describe('CSV generation patterns', () => {
    it('should produce valid CSV with header and data rows', () => {
      const header = toCsvRow(['Name', 'Description', 'Status'])
      const row1 = toCsvRow(['Product A', 'A great product', 'ACTIVE'])
      const row2 = toCsvRow(['Product B', 'Has, commas', 'DRAFT'])
      const csv = [header, row1, row2].join('\n')

      const lines = csv.split('\n')
      expect(lines).toHaveLength(3)
      expect(lines[0]).toBe('Name,Description,Status')
      expect(lines[1]).toBe('Product A,A great product,ACTIVE')
      expect(lines[2]).toBe('Product B,"Has, commas",DRAFT')
    })

    it('should handle real-world idea data', () => {
      const row = toCsvRow([
        'Add dark mode support',
        'Users have been requesting dark mode.',
        'PLANNED',
        'user_123',
        47,
        5000,
        2,
        0.8,
        3,
        2666.67,
        'ux; performance',
        '2026-01-15',
      ])
      expect(row).toContain('Add dark mode support')
      expect(row).toContain('47')
      expect(row).toContain('2666.67')
    })
  })
})
