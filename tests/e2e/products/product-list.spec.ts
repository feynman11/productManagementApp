import { test, expect } from '@playwright/test'

test.describe('Product List', () => {
  test.skip('should filter products by status', async ({ page }) => {
    // TODO: Authenticate as client user
    // 1. Navigate to /{orgSlug}/products
    // 2. Verify all products are shown initially
    // 3. Click or select "Active" status filter
    // 4. Verify only products with ACTIVE status are shown
    // 5. Click or select "Archived" filter
    // 6. Verify only archived products are shown
    // 7. Clear filter, verify all products return
  })

  test.skip('should search products by name', async ({ page }) => {
    // TODO: Authenticate as client user
    // 1. Navigate to /{orgSlug}/products
    // 2. Locate the search input field
    // 3. Type a known product name (e.g., "Widget")
    // 4. Verify only matching products are displayed
    // 5. Clear search input
    // 6. Verify all products are displayed again
  })

  test.skip('should show product counts (ideas, issues)', async ({ page }) => {
    // TODO: Authenticate as client user
    // 1. Navigate to /{orgSlug}/products
    // 2. Verify each product card or row displays:
    //    - Ideas count badge
    //    - Issues count badge
    // 3. Verify counts match seed data (e.g., Widget Pro has 3 ideas, 2 issues)
  })

  test.skip('should display empty state when no products exist', async ({ page }) => {
    // TODO: Authenticate as user in a client with no products
    // 1. Navigate to /{orgSlug}/products
    // 2. Verify empty state illustration or message is displayed
    // 3. Verify "Create your first product" CTA is visible
  })

  test.skip('should navigate to product detail on click', async ({ page }) => {
    // TODO: Authenticate as client user
    // 1. Navigate to /{orgSlug}/products
    // 2. Click on a product name or card
    // 3. Verify navigation to /{orgSlug}/products/{productId}
    // 4. Verify product detail page renders correctly
  })

  test.skip('should sort products by name', async ({ page }) => {
    // TODO: Authenticate as client user
    // 1. Navigate to /{orgSlug}/products
    // 2. Click on "Name" column header or sort control
    // 3. Verify products are sorted alphabetically A-Z
    // 4. Click again to reverse sort
    // 5. Verify products are sorted Z-A
  })

  test.skip('should show product status badges with correct colors', async ({ page }) => {
    // TODO: Authenticate as client user
    // 1. Navigate to /{orgSlug}/products
    // 2. Verify ACTIVE products have a success/green badge
    // 3. Verify ARCHIVED products have a muted/gray badge
  })
})
