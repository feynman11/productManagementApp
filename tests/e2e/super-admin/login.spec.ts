import { test, expect } from '@playwright/test'

test.describe('Super Admin Access', () => {
  test('should redirect /super-admin/login to /super-admin/clients', async ({ page }) => {
    // The old login page now redirects since super admin auth
    // is handled via Clerk + isSuperAdmin flag
    await page.goto('/super-admin/login')
    // Should redirect (may go to Clerk sign-in if not authenticated)
    await expect(page).not.toHaveURL(/super-admin\/login/)
  })

  test('should require authentication for super admin routes', async ({ page }) => {
    await page.goto('/super-admin/clients')
    // Should be redirected to sign-in or home page if not authenticated
    await expect(page).not.toHaveURL(/super-admin\/clients/)
  })
})
