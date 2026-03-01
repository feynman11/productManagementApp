import { test, expect } from '@playwright/test'

test.describe('Idea Promotion', () => {
  test.skip('should promote idea to roadmap item', async ({ page }) => {
    // TODO: Authenticate as CLIENT_ADMIN
    // 1. Navigate to an idea with status SUBMITTED or UNDER_REVIEW
    // 2. Click "Promote to Roadmap" button
    // 3. Select the target roadmap from dropdown
    // 4. Confirm promotion
    // 5. Verify idea status changes to PLANNED
    // 6. Navigate to the target roadmap
    // 7. Verify a new roadmap item exists linked to this idea
  })

  test.skip('should only show promote button for admins', async ({ page }) => {
    // TODO: Authenticate as CLIENT_USER (non-admin)
    // 1. Navigate to an idea detail page
    // 2. Verify "Promote to Roadmap" button is not visible
    // 3. Verify other action buttons (edit, etc.) may still be visible
  })

  test.skip('should not allow promoting already-promoted ideas', async ({ page }) => {
    // TODO: Authenticate as CLIENT_ADMIN
    // 1. Navigate to an idea that is already PLANNED or COMPLETED
    // 2. Verify "Promote to Roadmap" button is disabled or hidden
    // 3. Verify a note indicates the idea is already on a roadmap
  })

  test.skip('should show linked roadmap item on promoted idea', async ({ page }) => {
    // TODO: Authenticate as client user
    // 1. Navigate to an idea that has been promoted
    // 2. Verify a link to the roadmap item is displayed
    // 3. Click the link
    // 4. Verify navigation to the roadmap item detail
  })

  test.skip('should reject an idea', async ({ page }) => {
    // TODO: Authenticate as CLIENT_ADMIN
    // 1. Navigate to an idea detail page
    // 2. Click "Reject" button
    // 3. Optionally add a rejection reason
    // 4. Confirm rejection
    // 5. Verify idea status changes to REJECTED
    // 6. Verify rejected badge is displayed
  })

  test.skip('should mark an idea as duplicate', async ({ page }) => {
    // TODO: Authenticate as CLIENT_ADMIN
    // 1. Navigate to an idea detail page
    // 2. Click "Mark as Duplicate" option
    // 3. Select the original idea it duplicates
    // 4. Confirm
    // 5. Verify idea status changes to DUPLICATE
  })
})
