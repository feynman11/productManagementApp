import { test, expect } from '@playwright/test'

test.describe('Product CRUD', () => {
  test.skip('should display products list for authenticated user', async ({ page }) => {
    // TODO: Authenticate as client user via Clerk test tokens
    // 1. Navigate to /{orgSlug}/products
    // 2. Verify the products page heading is visible
    // 3. Verify products from seed data are listed (e.g., "Widget Pro", "Analytics Suite")
    // 4. Verify each product card shows name, description, and status
  })

  test.skip('should create a new product', async ({ page }) => {
    // TODO: Authenticate as CLIENT_USER or CLIENT_ADMIN
    // 1. Navigate to /{orgSlug}/products
    // 2. Click "New Product" or "Create Product" button
    // 3. Fill form: name ("Test Product"), description ("A test product"), color
    // 4. Submit the form
    // 5. Verify redirect to product detail page
    // 6. Verify product name and description are displayed
  })

  test.skip('should validate product creation form', async ({ page }) => {
    // TODO: Authenticate as CLIENT_USER or CLIENT_ADMIN
    // 1. Navigate to create product form
    // 2. Submit empty form
    // 3. Verify validation error for required name field
    // 4. Fill only name, submit
    // 5. Verify product is created (description is optional)
  })

  test.skip('should edit an existing product', async ({ page }) => {
    // TODO: Authenticate as CLIENT_USER or CLIENT_ADMIN
    // 1. Navigate to a product detail page
    // 2. Click "Edit" button
    // 3. Update the product name to "Updated Product Name"
    // 4. Save changes
    // 5. Verify the updated name is displayed on the detail page
    // 6. Navigate back to products list, verify updated name appears
  })

  test.skip('should archive a product (admin only)', async ({ page }) => {
    // TODO: Authenticate as CLIENT_ADMIN
    // 1. Navigate to a product detail page
    // 2. Click "Archive" button or menu option
    // 3. Confirm the archival dialog
    // 4. Verify product status changes to ARCHIVED
    // 5. Verify archived badge is displayed
  })

  test.skip('should restore an archived product (admin only)', async ({ page }) => {
    // TODO: Authenticate as CLIENT_ADMIN
    // 1. Navigate to an archived product detail page
    // 2. Click "Restore" button
    // 3. Verify product status changes back to ACTIVE
  })

  test.skip('should prevent viewers from creating products', async ({ page }) => {
    // TODO: Authenticate as CLIENT_VIEWER
    // 1. Navigate to /{orgSlug}/products
    // 2. Verify "New Product" button is not visible or is disabled
    // 3. Attempt to navigate directly to /{orgSlug}/products/new
    // 4. Verify access is denied or user is redirected
  })

  test.skip('should prevent viewers from editing products', async ({ page }) => {
    // TODO: Authenticate as CLIENT_VIEWER
    // 1. Navigate to a product detail page
    // 2. Verify "Edit" button is not visible
    // 3. Verify product info is displayed in read-only mode
  })

  test.skip('should enforce client isolation', async ({ page }) => {
    // TODO: Authenticate as Client A user
    // 1. Navigate to Client A products page
    // 2. Verify only Client A products are visible
    // 3. Capture the URL of a Client B product (known from seed data)
    // 4. Navigate directly to that URL
    // 5. Verify access is denied (404 or redirect)
    // 6. Verify no Client B data is leaked
  })

  test.skip('should show product detail with related counts', async ({ page }) => {
    // TODO: Authenticate as client user
    // 1. Navigate to a product detail page
    // 2. Verify product name, description, status are displayed
    // 3. Verify related counts are shown: ideas count, issues count, roadmaps count
    // 4. Verify navigation tabs for Ideas, Issues, Roadmap are present
  })
})
