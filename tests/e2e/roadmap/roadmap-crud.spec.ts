import { test, expect } from '@playwright/test'

test.describe('Roadmap CRUD', () => {
  test.skip('should display roadmaps for a product', async ({ page }) => {
    // TODO: Authenticate as client user
    // 1. Navigate to /{orgSlug}/products/{productId}/roadmap
    // 2. Verify the roadmap page heading is visible
    // 3. Verify roadmaps from seed data are listed
    // 4. Verify each roadmap shows: name, description, item count
  })

  test.skip('should create a new roadmap', async ({ page }) => {
    // TODO: Authenticate as CLIENT_ADMIN
    // 1. Navigate to product roadmap page
    // 2. Click "Create Roadmap" button
    // 3. Fill form: name ("Q1 2026 Roadmap"), description ("First quarter priorities")
    // 4. Submit the form
    // 5. Verify redirect to the new roadmap detail page
    // 6. Verify roadmap name and description are displayed
  })

  test.skip('should validate roadmap creation form', async ({ page }) => {
    // TODO: Authenticate as CLIENT_ADMIN
    // 1. Navigate to create roadmap form
    // 2. Submit empty form
    // 3. Verify validation error for required name field
  })

  test.skip('should edit a roadmap', async ({ page }) => {
    // TODO: Authenticate as CLIENT_ADMIN
    // 1. Navigate to a roadmap detail page
    // 2. Click "Edit" button
    // 3. Update the roadmap name
    // 4. Save changes
    // 5. Verify updated name is displayed
  })

  test.skip('should add items to a roadmap', async ({ page }) => {
    // TODO: Authenticate as CLIENT_USER or CLIENT_ADMIN
    // 1. Navigate to a roadmap detail page
    // 2. Click "Add Item" button
    // 3. Fill form: title ("New Feature X"), description, status (BACKLOG)
    // 4. Submit
    // 5. Verify item appears in the Backlog column (Kanban) or list
  })

  test.skip('should edit a roadmap item', async ({ page }) => {
    // TODO: Authenticate as CLIENT_USER or CLIENT_ADMIN
    // 1. Navigate to roadmap detail page
    // 2. Click on an existing item
    // 3. Update title and status
    // 4. Save changes
    // 5. Verify item reflects the update
  })

  test.skip('should move roadmap item between statuses', async ({ page }) => {
    // TODO: Authenticate as CLIENT_USER or CLIENT_ADMIN
    // 1. Navigate to roadmap detail (Kanban view)
    // 2. Drag an item from BACKLOG to IN_PROGRESS (or use status dropdown)
    // 3. Verify item moves to the IN_PROGRESS column
    // 4. Reload page, verify persistence
  })

  test.skip('should create a release', async ({ page }) => {
    // TODO: Authenticate as CLIENT_ADMIN
    // 1. Navigate to roadmap detail page
    // 2. Click "Create Release" button
    // 3. Fill form: name ("v1.0"), target date, description
    // 4. Submit
    // 5. Verify release appears in the releases section
    // 6. Verify target date is displayed correctly
  })

  test.skip('should assign items to a release', async ({ page }) => {
    // TODO: Authenticate as CLIENT_ADMIN
    // 1. Navigate to a roadmap item
    // 2. Assign it to an existing release
    // 3. Save
    // 4. Navigate to the release detail
    // 5. Verify the item appears under that release
  })

  test.skip('should delete a roadmap (admin only)', async ({ page }) => {
    // TODO: Authenticate as CLIENT_ADMIN
    // 1. Navigate to a roadmap detail page
    // 2. Click "Delete" button
    // 3. Confirm deletion dialog
    // 4. Verify redirect to roadmaps list
    // 5. Verify the deleted roadmap is no longer in the list
  })

  test.skip('should enforce client isolation for roadmaps', async ({ page }) => {
    // TODO: Authenticate as Client A user
    // 1. Navigate to Client A product roadmaps
    // 2. Verify only Client A roadmaps are visible
    // 3. Attempt to access Client B roadmap URL directly
    // 4. Verify access is denied (404 or redirect)
  })
})
