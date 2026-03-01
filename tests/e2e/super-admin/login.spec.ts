import { test, expect } from '@playwright/test'

test.describe('Super Admin Login', () => {
  test('should render login form', async ({ page }) => {
    await page.goto('/super-admin/login')
    await expect(page.getByRole('heading', { name: /super admin/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/super-admin/login')
    await page.getByLabel(/email/i).fill('wrong@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()
    // Should show error message
    await expect(page.getByText(/invalid|failed|error/i)).toBeVisible({ timeout: 5000 })
  })

  test('should not allow empty form submission', async ({ page }) => {
    await page.goto('/super-admin/login')
    await page.getByRole('button', { name: /sign in/i }).click()
    // Browser-native validation or custom error should prevent submission
    // Check that we are still on the login page
    await expect(page).toHaveURL(/super-admin\/login/)
  })

  test('should have password field masked', async ({ page }) => {
    await page.goto('/super-admin/login')
    const passwordInput = page.getByLabel(/password/i)
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test.skip('should redirect to dashboard on valid login', async ({ page }) => {
    // TODO: Implement when super admin test credentials are configured
    // 1. Fill in valid super admin credentials
    // 2. Submit the form
    // 3. Verify redirect to /super-admin/dashboard
  })

  test.skip('should persist session after login', async ({ page }) => {
    // TODO: Implement when super admin auth fixture is ready
    // 1. Login as super admin
    // 2. Navigate away and back
    // 3. Verify still authenticated
  })
})
