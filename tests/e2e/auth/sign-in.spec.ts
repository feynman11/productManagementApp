import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should show sign-in option on the landing page', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'ProductPlan' })).toBeVisible()
    await expect(page.getByText('Sign In')).toBeVisible()
  })

  test('should redirect unauthenticated users from protected routes', async ({ page }) => {
    await page.goto('/acme-corp/products')
    // Should show the Clerk sign-in component
    // The exact behavior depends on Clerk configuration
    await expect(page).not.toHaveURL('/acme-corp/products')
  })
})
