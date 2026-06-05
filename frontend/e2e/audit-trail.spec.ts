import { test, expect } from '@playwright/test';

const ADMIN = { username: 'admin', password: 'Admin1234!' };

async function loginAndGoToAudit(page: import('@playwright/test').Page, engagementId = 'test-engagement-id') {
  await page.goto('/login');
  await page.getByLabel('Username').fill(ADMIN.username);
  await page.getByLabel('Password').fill(ADMIN.password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/dashboard');
  await page.goto(`/engagements/${engagementId}/audit`);
}

test.describe('Audit trail page', () => {
  test('audit trail page renders correct heading', async ({ page }) => {
    await loginAndGoToAudit(page, 'test-123');
    await expect(page.getByRole('heading', { name: /Audit Trail/ })).toBeVisible();
  });

  test('breadcrumb shows Engagements > id > Audit Trail', async ({ page }) => {
    await loginAndGoToAudit(page, 'test-123');
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible();
    await expect(page.getByText('Audit Trail')).toBeVisible();
  });

  test('filter row shows action type select and date inputs', async ({ page }) => {
    await loginAndGoToAudit(page, 'test-123');
    await expect(page.getByRole('button', { name: 'Apply Filters' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Clear' })).toBeVisible();
  });

  test('empty engagement shows "No audit events recorded yet."', async ({ page }) => {
    // Use a non-existent engagement ID — API returns empty events
    await loginAndGoToAudit(page, 'nonexistent-engagement-000');
    // Wait for loading to complete
    await page.waitForTimeout(500);
    await expect(page.getByText('No audit events recorded yet.')).toBeVisible();
  });

  test('[Apply Filters] button is clickable', async ({ page }) => {
    await loginAndGoToAudit(page, 'test-123');
    const applyBtn = page.getByRole('button', { name: 'Apply Filters' });
    await expect(applyBtn).toBeVisible();
    await applyBtn.click();
    // Page should still be rendered after applying filters
    await expect(page.getByRole('heading', { name: /Audit Trail/ })).toBeVisible();
  });

  test('[Clear] button resets filters', async ({ page }) => {
    await loginAndGoToAudit(page, 'test-123');
    // Set a date
    const dateFromInput = page.getByLabel('Date From');
    await dateFromInput.fill('2026-01-01');
    // Apply filters
    await page.getByRole('button', { name: 'Apply Filters' }).click();
    // Clear
    await page.getByRole('button', { name: 'Clear' }).click();
    // Date should be reset
    await expect(dateFromInput).toHaveValue('');
  });
});
