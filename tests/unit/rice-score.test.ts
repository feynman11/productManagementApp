import { describe, it, expect } from 'vitest'

// Replicate the RICE calculation function for testing
// RICE = (Reach * Impact * Confidence) / Effort
// Returns null if any component is null/undefined or if effort is zero
function calculateRiceScore(
  reach: number | null,
  impact: number | null,
  confidence: number | null,
  effort: number | null,
): number | null {
  if (reach == null || impact == null || confidence == null || effort == null || effort === 0) return null
  return (reach * impact * confidence) / effort
}

describe('RICE Score Calculation', () => {
  it('should calculate RICE score correctly', () => {
    // (1000 * 3 * 0.8) / 5 = 480
    expect(calculateRiceScore(1000, 3, 0.8, 5)).toBe(480)
  })

  it('should calculate with different values', () => {
    // (500 * 2 * 0.5) / 3 = 166.666...
    expect(calculateRiceScore(500, 2, 0.5, 3)).toBeCloseTo(166.667, 2)
  })

  it('should return null when reach is null', () => {
    expect(calculateRiceScore(null, 3, 0.8, 5)).toBeNull()
  })

  it('should return null when impact is null', () => {
    expect(calculateRiceScore(1000, null, 0.8, 5)).toBeNull()
  })

  it('should return null when confidence is null', () => {
    expect(calculateRiceScore(1000, 3, null, 5)).toBeNull()
  })

  it('should return null when effort is null', () => {
    expect(calculateRiceScore(1000, 3, 0.8, null)).toBeNull()
  })

  it('should return null when effort is zero', () => {
    expect(calculateRiceScore(1000, 3, 0.8, 0)).toBeNull()
  })

  it('should handle edge case with very small values', () => {
    expect(calculateRiceScore(1, 1, 0.1, 1)).toBeCloseTo(0.1, 5)
  })

  it('should handle large values', () => {
    expect(calculateRiceScore(100000, 5, 1.0, 10)).toBe(50000)
  })

  it('should handle confidence of 1.0 (100%)', () => {
    // (200 * 4 * 1.0) / 8 = 100
    expect(calculateRiceScore(200, 4, 1.0, 8)).toBe(100)
  })

  it('should handle fractional reach', () => {
    // (250.5 * 2 * 0.5) / 1 = 250.5
    expect(calculateRiceScore(250.5, 2, 0.5, 1)).toBe(250.5)
  })

  it('should handle minimum valid values', () => {
    // (1 * 1 * 0.01) / 1 = 0.01
    expect(calculateRiceScore(1, 1, 0.01, 1)).toBeCloseTo(0.01, 5)
  })

  it('should handle very high effort reducing score', () => {
    // (100 * 3 * 0.8) / 1000 = 0.24
    expect(calculateRiceScore(100, 3, 0.8, 1000)).toBeCloseTo(0.24, 5)
  })

  it('should produce higher scores for higher reach', () => {
    const lowReach = calculateRiceScore(100, 3, 0.8, 5)!
    const highReach = calculateRiceScore(10000, 3, 0.8, 5)!
    expect(highReach).toBeGreaterThan(lowReach)
  })

  it('should produce lower scores for higher effort', () => {
    const lowEffort = calculateRiceScore(1000, 3, 0.8, 2)!
    const highEffort = calculateRiceScore(1000, 3, 0.8, 20)!
    expect(lowEffort).toBeGreaterThan(highEffort)
  })
})
