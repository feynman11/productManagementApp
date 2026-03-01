import { test, expect } from '@playwright/test'

test.describe('Smoke Tests', () => {
  test('should load the landing page', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/ProductPlan/)
  })

  test('should have proper meta tags', async ({ page }) => {
    await page.goto('/')
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content')
    expect(viewport).toContain('width=device-width')
  })
})
