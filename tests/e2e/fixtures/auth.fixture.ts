import { test as base, type Page } from '@playwright/test'

// Extend the base test with auth helpers
export const test = base.extend<{
  authenticatedPage: Page
}>({
  authenticatedPage: async ({ page }, use) => {
    // TODO: Implement Clerk test auth
    // For now, this is a placeholder that will be filled in
    // when Clerk testing tokens are configured
    //
    // Options:
    // 1. Use Clerk's testing tokens (recommended)
    // 2. Use Clerk's test mode with pre-created test users
    // 3. Set auth cookies directly
    await use(page)
  },
})

export { expect } from '@playwright/test'
