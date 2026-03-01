import { test, expect } from '@playwright/test'

test.describe('Issue CRUD', () => {
  test.skip('should display issues for a product', async ({ page }) => {
    // TODO: Authenticate as client user
    // 1. Navigate to /{orgSlug}/products/{productId}/issues
    // 2. Verify the issues page heading is visible
    // 3. Verify issues from seed data are listed
    // 4. Verify each issue shows: title, severity badge, status badge, assignee (if assigned)
  })

  test.skip('should report a new issue', async ({ page }) => {
    // TODO: Authenticate as CLIENT_USER or CLIENT_ADMIN
    // 1. Navigate to product issues page
    // 2. Click "Report Issue" or "New Issue" button
    // 3. Fill form: title ("Login button broken"), description ("Clicking login does nothing"), severity (HIGH)
    // 4. Submit the form
    // 5. Verify redirect to issue detail page or back to list
    // 6. Verify the new issue appears in the issues list
    // 7. Verify default status is OPEN
  })

  test.skip('should validate issue creation form', async ({ page }) => {
    // TODO: Authenticate as CLIENT_USER or CLIENT_ADMIN
    // 1. Navigate to new issue form
    // 2. Submit empty form
    // 3. Verify validation error for required title field
    // 4. Verify validation error for required severity field
  })

  test.skip('should edit an existing issue', async ({ page }) => {
    // TODO: Authenticate as CLIENT_USER or CLIENT_ADMIN
    // 1. Navigate to an issue detail page
    // 2. Click "Edit" button
    // 3. Update title, description, and severity
    // 4. Save changes
    // 5. Verify updated fields are displayed
  })

  test.skip('should change issue status', async ({ page }) => {
    // TODO: Authenticate as CLIENT_USER or CLIENT_ADMIN
    // 1. Navigate to an issue detail page with OPEN status
    // 2. Change status to IN_PROGRESS
    // 3. Verify status badge updates
    // 4. Change status to RESOLVED
    // 5. Verify status badge updates
    // 6. Change status to CLOSED
    // 7. Verify status badge updates
  })

  test.skip('should filter by severity', async ({ page }) => {
    // TODO: Authenticate as client user
    // 1. Navigate to product issues page
    // 2. Select CRITICAL severity filter
    // 3. Verify only critical issues are shown
    // 4. Select HIGH severity filter
    // 5. Verify only high severity issues are shown
    // 6. Clear filter, verify all issues return
  })

  test.skip('should filter by status', async ({ page }) => {
    // TODO: Authenticate as client user
    // 1. Navigate to product issues page
    // 2. Select OPEN status filter
    // 3. Verify only open issues are shown
    // 4. Select RESOLVED status filter
    // 5. Verify only resolved issues are shown
    // 6. Clear filter, verify all issues return
  })

  test.skip('should search issues by title', async ({ page }) => {
    // TODO: Authenticate as client user
    // 1. Navigate to product issues page
    // 2. Type a known issue title in the search input
    // 3. Verify only matching issues are displayed
    // 4. Clear search, verify all issues return
  })

  test.skip('should show severity badges with correct styling', async ({ page }) => {
    // TODO: Authenticate as client user
    // 1. Navigate to product issues page
    // 2. Verify CRITICAL issues have a red/danger badge
    // 3. Verify HIGH issues have an orange/warning badge
    // 4. Verify MEDIUM issues have a yellow badge
    // 5. Verify LOW issues have a blue/info badge
  })

  test.skip('should prevent viewers from creating issues', async ({ page }) => {
    // TODO: Authenticate as CLIENT_VIEWER
    // 1. Navigate to product issues page
    // 2. Verify "Report Issue" button is not visible or disabled
  })

  test.skip('should enforce client isolation for issues', async ({ page }) => {
    // TODO: Authenticate as Client A user
    // 1. Navigate to Client A product issues
    // 2. Verify only Client A issues are visible
    // 3. Attempt to access Client B issue URL directly
    // 4. Verify access is denied (404 or redirect)
  })

  test.skip('should display issue detail page correctly', async ({ page }) => {
    // TODO: Authenticate as client user
    // 1. Navigate to an issue detail page
    // 2. Verify the following are displayed:
    //    - Issue title and description
    //    - Severity badge
    //    - Status badge
    //    - Assignee (if assigned)
    //    - Created date
    //    - Reporter info
    //    - Related product link
  })
})
