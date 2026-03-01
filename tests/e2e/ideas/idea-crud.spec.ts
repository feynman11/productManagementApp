import { test, expect } from '@playwright/test'

test.describe('Idea CRUD', () => {
  test.skip('should display ideas list for a product', async ({ page }) => {
    // TODO: Authenticate as client user
    // 1. Navigate to /{orgSlug}/products/{productId}/ideas
    // 2. Verify the ideas page heading is visible
    // 3. Verify ideas from seed data are listed with titles
    // 4. Verify each idea shows: title, status badge, vote count, RICE score (if calculated)
  })

  test.skip('should submit a new idea', async ({ page }) => {
    // TODO: Authenticate as CLIENT_USER or CLIENT_ADMIN
    // 1. Navigate to product ideas page
    // 2. Click "Submit Idea" or "New Idea" button
    // 3. Fill form: title ("My New Idea"), description ("A detailed description")
    // 4. Submit the form
    // 5. Verify redirect to idea detail page or back to list
    // 6. Verify the new idea appears in the ideas list
    // 7. Verify default status is SUBMITTED
  })

  test.skip('should validate idea submission form', async ({ page }) => {
    // TODO: Authenticate as CLIENT_USER or CLIENT_ADMIN
    // 1. Navigate to new idea form
    // 2. Submit empty form
    // 3. Verify validation error for required title field
    // 4. Fill title only, submit
    // 5. Verify idea is created (description may be optional)
  })

  test.skip('should edit idea details', async ({ page }) => {
    // TODO: Authenticate as CLIENT_USER or CLIENT_ADMIN (idea owner or admin)
    // 1. Navigate to an idea detail page
    // 2. Click "Edit" button
    // 3. Update title to "Updated Idea Title"
    // 4. Update description
    // 5. Save changes
    // 6. Verify updated title and description are displayed
  })

  test.skip('should update idea status (admin only)', async ({ page }) => {
    // TODO: Authenticate as CLIENT_ADMIN
    // 1. Navigate to an idea detail page
    // 2. Change status from SUBMITTED to UNDER_REVIEW
    // 3. Save/confirm the status change
    // 4. Verify status badge updates to UNDER_REVIEW
    // 5. Verify status change is persisted on page reload
  })

  test.skip('should set RICE score components', async ({ page }) => {
    // TODO: Authenticate as CLIENT_ADMIN
    // 1. Navigate to an idea detail page
    // 2. Fill in Reach (1000), Impact (3), Confidence (0.8), Effort (5)
    // 3. Save changes
    // 4. Verify calculated RICE score is displayed: (1000 * 3 * 0.8) / 5 = 480
  })

  test.skip('should filter ideas by status', async ({ page }) => {
    // TODO: Authenticate as client user
    // 1. Navigate to product ideas page
    // 2. Select SUBMITTED filter
    // 3. Verify only submitted ideas are shown
    // 4. Select UNDER_REVIEW filter
    // 5. Verify only under review ideas are shown
    // 6. Clear filters, verify all ideas return
  })

  test.skip('should sort ideas by RICE score', async ({ page }) => {
    // TODO: Authenticate as client user
    // 1. Navigate to product ideas page
    // 2. Click sort by RICE score
    // 3. Verify ideas are sorted by RICE score descending
  })

  test.skip('should prevent viewers from submitting ideas', async ({ page }) => {
    // TODO: Authenticate as CLIENT_VIEWER
    // 1. Navigate to product ideas page
    // 2. Verify "Submit Idea" button is not visible or disabled
  })

  test.skip('should enforce client isolation for ideas', async ({ page }) => {
    // TODO: Authenticate as Client A user
    // 1. Navigate to Client A product ideas
    // 2. Verify only Client A ideas are visible
    // 3. Attempt to access Client B idea URL directly
    // 4. Verify access is denied (404 or redirect)
  })
})
