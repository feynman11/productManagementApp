import { test as base } from '@playwright/test'

// Extend the base test with database seeding
export const test = base.extend<{
  seededDb: void
}>({
  seededDb: async ({}, use) => {
    // TODO: Run seed script before tests
    // For now, assume the database is seeded before the test suite
    console.log('Using pre-seeded database for tests')
    await use()
  },
})

export { expect } from '@playwright/test'
