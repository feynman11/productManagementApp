import { test, expect } from '@playwright/test'

test.describe('Issue Assignment', () => {
  test.skip('should assign issue to a team member', async ({ page }) => {
    // TODO: Authenticate as CLIENT_ADMIN
    // 1. Navigate to an unassigned issue detail page
    // 2. Click the assignee field or "Assign" button
    // 3. Select a team member from the dropdown
    // 4. Verify the assignee is displayed on the issue
    // 5. Reload the page, verify assignment persists
  })

  test.skip('should reassign an issue to a different team member', async ({ page }) => {
    // TODO: Authenticate as CLIENT_ADMIN
    // 1. Navigate to an assigned issue detail page
    // 2. Click the assignee field
    // 3. Select a different team member
    // 4. Verify the assignee changes
  })

  test.skip('should unassign an issue', async ({ page }) => {
    // TODO: Authenticate as CLIENT_ADMIN
    // 1. Navigate to an assigned issue detail page
    // 2. Click the assignee field
    // 3. Click "Unassign" or clear the selection
    // 4. Verify the assignee is removed
    // 5. Verify "Unassigned" label is shown
  })

  test.skip('should only show assignment controls for admins', async ({ page }) => {
    // TODO: Authenticate as CLIENT_USER (non-admin)
    // 1. Navigate to an issue detail page
    // 2. Verify the assignee field is displayed but not editable
    // 3. Verify no "Assign" button or dropdown is available
  })

  test.skip('should hide assignment controls for viewers', async ({ page }) => {
    // TODO: Authenticate as CLIENT_VIEWER
    // 1. Navigate to an issue detail page
    // 2. Verify the assignee is displayed in read-only mode
    // 3. Verify no interactive assignment controls are present
  })

  test.skip('should filter issues by assignee', async ({ page }) => {
    // TODO: Authenticate as client user
    // 1. Navigate to product issues page
    // 2. Select an assignee from the assignee filter
    // 3. Verify only issues assigned to that person are shown
    // 4. Select "Unassigned" filter
    // 5. Verify only unassigned issues are shown
    // 6. Clear filter, verify all issues return
  })

  test.skip('should show assignee avatar on issue list', async ({ page }) => {
    // TODO: Authenticate as client user
    // 1. Navigate to product issues page
    // 2. Verify assigned issues show the assignee avatar/initials
    // 3. Verify unassigned issues show a placeholder icon
  })

  test.skip('should allow self-assignment for users', async ({ page }) => {
    // TODO: Authenticate as CLIENT_USER
    // 1. Navigate to an unassigned issue
    // 2. Click "Assign to me" button (if available)
    // 3. Verify the current user is now the assignee
  })
})
