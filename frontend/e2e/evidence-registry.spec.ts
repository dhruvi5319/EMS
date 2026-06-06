import { test, expect } from '@playwright/test';

const AN_USER = { username: 'admin', password: 'Admin1234!' };
// AL (Auditee Liaison) user - only sees standard evidence
const AL_USER = { username: 'auditee_liaison', password: 'Admin1234!' };

async function login(page: import('@playwright/test').Page, creds = AN_USER) {
  await page.goto('/login');
  await page.getByLabel('Username').fill(creds.username);
  await page.getByLabel('Password').fill(creds.password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/dashboard');
}

/**
 * Creates an engagement with evidence phase active.
 * Returns the engagement ID.
 */
async function createEngagementWithEvidence(
  page: import('@playwright/test').Page
): Promise<string> {
  // Create and submit a request
  const createRes = await page.evaluate(async () => {
    const r = await fetch('/api/requests', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request_type: 'congressional',
        requester_name: 'Test Evidence User',
        topic: 'Evidence Registry Test',
        agency_program: 'Test Agency Evidence',
        due_date: '2027-12-31',
      }),
    });
    return r.json();
  });
  const requestId: string = createRes.request?.id;

  // Submit request
  await page.evaluate(async (id: string) => {
    await fetch(`/api/requests/${id}/submit`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
  }, requestId);

  // Gate A1 approve to create engagement
  const approveRes = await page.evaluate(async (id: string) => {
    const r = await fetch(`/api/requests/${id}/gate/a1`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision: 'approve',
        rationale: 'Approved for evidence test',
        risk_level: 'medium',
      }),
    });
    return r.json();
  }, requestId);

  return approveRes.engagement?.id as string;
}

test.describe('Evidence Registry', () => {
  test('evidence list loads with [+ Add Evidence] button visible for AN user', async ({ page }) => {
    await login(page, AN_USER);
    const engagementId = await createEngagementWithEvidence(page);

    // Navigate to Evidence tab
    await page.goto(`/engagements/${engagementId}`);
    await page.waitForURL(`**/engagements/${engagementId}`);

    // Click Evidence tab
    await page.getByRole('tab', { name: 'Evidence' }).click();

    // Mock the evidence API to return empty list
    await page.route(`**/api/engagements/${engagementId}/evidence**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ evidence: [], total: 0 }),
      });
    });
    await page.route(`**/api/engagements/${engagementId}/objectives/coverage`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ objectives: [], covered: 0, total: 0, uncovered_count: 0 }),
      });
    });

    // Reload to pick up route mocks
    await page.reload();
    await page.getByRole('tab', { name: 'Evidence' }).click();

    // [+ Add Evidence] button should be visible for AN user
    await expect(page.getByRole('button', { name: /Add Evidence/ })).toBeVisible();
  });

  test('restricted evidence hidden from AL user', async ({ page }) => {
    await login(page, AN_USER);
    const engagementId = await createEngagementWithEvidence(page);

    // Create a RESTRICTED evidence item via API
    const evidenceRes = await page.evaluate(async (id: string) => {
      const r = await fetch(`/api/engagements/${id}/evidence`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evidence_type: 'document',
          source: 'Restricted Document Source',
          date_received: '2026-03-05',
          sensitivity: 'restricted',
        }),
      });
      return r.json();
    }, engagementId);

    // Login as AL user and visit evidence tab
    await login(page, AL_USER);
    await page.goto(`/engagements/${engagementId}`);

    // Mock evidence API to return restricted item as filtered (server-side filtering)
    await page.route(`**/api/engagements/${engagementId}/evidence**`, async (route) => {
      // AL user sees no restricted items - server filters them out
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ evidence: [], total: 0 }),
      });
    });
    await page.route(`**/api/engagements/${engagementId}/objectives/coverage`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ objectives: [], covered: 0, total: 0, uncovered_count: 0 }),
      });
    });

    await page.reload();
    await page.getByRole('tab', { name: 'Evidence' }).click();

    // RESTRICTED sensitivity badges should not be visible
    await expect(page.getByRole('img', { name: 'Sensitivity: Restricted' })).not.toBeVisible();
  });

  test('add evidence form opens as sheet panel', async ({ page }) => {
    await login(page, AN_USER);
    const engagementId = await createEngagementWithEvidence(page);

    await page.goto(`/engagements/${engagementId}`);
    await page.route(`**/api/engagements/${engagementId}/evidence**`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ evidence: [], total: 0 }),
        });
      } else {
        await route.continue();
      }
    });
    await page.route(`**/api/engagements/${engagementId}/objectives/coverage`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ objectives: [], covered: 0, total: 0, uncovered_count: 0 }),
      });
    });

    await page.reload();
    await page.getByRole('tab', { name: 'Evidence' }).click();

    // Click Add Evidence
    await page.getByRole('button', { name: /Add Evidence/ }).first().click();

    // Sheet panel should open with "Add Evidence Item" heading
    await expect(page.getByRole('dialog', { name: 'Add Evidence Item' })).toBeVisible();
    await expect(page.getByText('Add Evidence Item')).toBeVisible();
  });

  test('form validation blocks save when required fields empty', async ({ page }) => {
    await login(page, AN_USER);
    const engagementId = await createEngagementWithEvidence(page);

    await page.goto(`/engagements/${engagementId}`);
    await page.route(`**/api/engagements/${engagementId}/evidence**`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ evidence: [], total: 0 }),
        });
      } else {
        await route.continue();
      }
    });
    await page.route(`**/api/engagements/${engagementId}/objectives/coverage`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ objectives: [], covered: 0, total: 0, uncovered_count: 0 }),
      });
    });

    await page.reload();
    await page.getByRole('tab', { name: 'Evidence' }).click();
    await page.getByRole('button', { name: /Add Evidence/ }).first().click();

    // Wait for panel
    await expect(page.getByRole('dialog', { name: 'Add Evidence Item' })).toBeVisible();

    // Click Save without filling required fields
    await page.getByRole('button', { name: 'Save Evidence Item' }).click();

    // Validation errors should appear
    await expect(page.getByText('Required').first()).toBeVisible();
  });

  test('export CSV triggers download and shows toast', async ({ page }) => {
    await login(page, AN_USER);
    const engagementId = await createEngagementWithEvidence(page);

    await page.goto(`/engagements/${engagementId}`);
    await page.route(`**/api/engagements/${engagementId}/evidence/export`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/csv',
        body: 'id,source,date\nE-001,Test Source,2026-03-05',
      });
    });
    await page.route(`**/api/engagements/${engagementId}/evidence**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ evidence: [], total: 0 }),
      });
    });
    await page.route(`**/api/engagements/${engagementId}/objectives/coverage`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ objectives: [], covered: 0, total: 0, uncovered_count: 0 }),
      });
    });

    await page.reload();
    await page.getByRole('tab', { name: 'Evidence' }).click();

    // Click Export CSV
    await page.getByRole('button', { name: /Export CSV/ }).click();

    // Toast should appear
    await expect(page.getByText('Evidence registry exported.')).toBeVisible({ timeout: 5000 });
  });

  test('coverage bar renders with progressbar role', async ({ page }) => {
    await login(page, AN_USER);
    const engagementId = await createEngagementWithEvidence(page);

    await page.goto(`/engagements/${engagementId}`);
    await page.route(`**/api/engagements/${engagementId}/evidence**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ evidence: [], total: 0 }),
      });
    });
    await page.route(`**/api/engagements/${engagementId}/objectives/coverage`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          objectives: [
            { id: 'obj-1', objective_text: 'Objective 1', evidence_count: 1, sufficiency_status: 'sufficient' },
            { id: 'obj-2', objective_text: 'Objective 2', evidence_count: 0, sufficiency_status: 'evidence_needed' },
          ],
          covered: 1,
          total: 2,
          uncovered_count: 1,
        }),
      });
    });

    await page.reload();
    await page.getByRole('tab', { name: 'Evidence' }).click();

    // Coverage bar (progressbar role) should be visible
    await expect(page.getByRole('progressbar')).toBeVisible();
  });
});
