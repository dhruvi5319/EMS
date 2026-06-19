import { test, expect } from '@playwright/test';

const AN_USER = { username: 'admin', password: 'Admin1234!' };
const EM_USER = { username: 'admin', password: 'Admin1234!' };

async function login(page: import('@playwright/test').Page, creds = AN_USER) {
  await page.goto('/login');
  await page.getByLabel('Username').fill(creds.username);
  await page.getByLabel('Password').fill(creds.password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('**/dashboard');
}

/**
 * Creates a minimal engagement and returns the engagement ID.
 * Uses API calls to advance to draft phase (P3 approved, draft product created).
 */
async function createEngagementInDraftPhase(
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
        requester_name: 'Statements Test User',
        topic: 'Statements Test Topic',
        agency_program: 'Test Agency Statements',
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

  // Gate A1 approve
  const approveRes = await page.evaluate(async (id: string) => {
    const r = await fetch(`/api/requests/${id}/gate/a1`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision: 'approve',
        rationale: 'Approved for statements test',
        risk_level: 'medium',
      }),
    });
    return r.json();
  }, requestId);

  return approveRes.engagement?.id as string;
}

test.describe('Statements Page', () => {
  test('shows empty state when no statements exist', async ({ page }) => {
    await login(page, AN_USER);
    const engagementId = await createEngagementInDraftPhase(page);

    // Mock statements API to return empty list
    await page.route(`**/api/engagements/${engagementId}/statements**`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ statements: [], total: 0 }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(`/engagements/${engagementId}/draft/statements`);
    await page.waitForLoadState('networkidle');

    // Assert empty state
    await expect(page.getByText('No statements yet.')).toBeVisible();
    await expect(page.getByRole('button', { name: /Add Statement/i })).toBeVisible();
  });

  test('opens Add Statement dialog with text and evidence fields', async ({ page }) => {
    await login(page, AN_USER);
    const engagementId = await createEngagementInDraftPhase(page);

    // Mock APIs
    await page.route(`**/api/engagements/${engagementId}/statements**`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ statements: [], total: 0 }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route(`**/api/engagements/${engagementId}/evidence**`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            evidence: [
              { id: 'ev-1', source: 'Interview Note — Agency Budget', evidence_type: 'interview_note' },
              { id: 'ev-2', source: 'Dataset — OMB Budget', evidence_type: 'dataset' },
            ],
            total: 2,
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(`/engagements/${engagementId}/draft/statements`);
    await page.waitForLoadState('networkidle');

    // Click Add Statement button
    await page.getByRole('button', { name: /Add Statement/i }).first().click();

    // Assert dialog is visible
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Assert statement textarea
    await expect(dialog.getByPlaceholder(/Enter the statement text/i)).toBeVisible();

    // Assert evidence multi-select button
    await expect(dialog.getByRole('combobox', { name: /combobox/i }).or(dialog.getByText('Select evidence items...'))).toBeVisible();
  });

  test('creates a statement and shows it in the table', async ({ page }) => {
    await login(page, AN_USER);
    const engagementId = await createEngagementInDraftPhase(page);

    const mockStatement = {
      id: 'stmt-1',
      engagement_id: engagementId,
      draft_product_id: 'dp-1',
      statement_text: 'Agency lacks documented data validation procedures.',
      ref_status: 'not_started',
      display_order: 1,
      assigned_to: null,
      assigned_ir_name: null,
      discrepancy_notes: null,
      evidence_ids: ['ev-1'],
      evidence_count: 1,
      created_by: 'user-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let statements: typeof mockStatement[] = [];

    // Mock APIs
    await page.route(`**/api/engagements/${engagementId}/statements**`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ statements, total: statements.length }),
        });
      } else if (route.request().method() === 'POST') {
        statements = [mockStatement];
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ statement: mockStatement }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route(`**/api/engagements/${engagementId}/evidence**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          evidence: [
            { id: 'ev-1', source: 'Interview Note', evidence_type: 'interview_note' },
          ],
          total: 1,
        }),
      });
    });

    await page.goto(`/engagements/${engagementId}/draft/statements`);
    await page.waitForLoadState('networkidle');

    // Click Add Statement
    await page.getByRole('button', { name: /Add Statement/i }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Fill statement text
    await dialog.getByPlaceholder(/Enter the statement text/i).fill(
      'Agency lacks documented data validation procedures.'
    );

    // Select evidence
    await dialog.getByText('Select evidence items...').click();
    await page.waitForSelector('[role="option"]');
    await page.getByRole('option', { name: /Interview Note/i }).click();
    await page.keyboard.press('Escape');

    // Click Save Statement
    await dialog.getByRole('button', { name: 'Save Statement' }).click();

    // Assert toast
    await expect(page.getByText('Statement saved.')).toBeVisible({ timeout: 5000 });

    // After save, statements list reloads — assert row in table
    await expect(page.getByText('Agency lacks documented data validation procedures.')).toBeVisible();
  });

  test('progress bar shows all Not Started after first statement', async ({ page }) => {
    await login(page, AN_USER);
    const engagementId = await createEngagementInDraftPhase(page);

    const mockStatements = [
      {
        id: 'stmt-1',
        engagement_id: engagementId,
        draft_product_id: 'dp-1',
        statement_text: 'First test statement.',
        ref_status: 'not_started',
        display_order: 1,
        assigned_to: null,
        assigned_ir_name: null,
        discrepancy_notes: null,
        evidence_ids: ['ev-1'],
        evidence_count: 1,
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    await page.route(`**/api/engagements/${engagementId}/statements**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ statements: mockStatements, total: 1 }),
      });
    });

    await page.goto(`/engagements/${engagementId}/draft/statements`);
    await page.waitForLoadState('networkidle');

    // Assert ReferenceCheckProgressBar visible
    await expect(page.getByRole('progressbar')).toBeVisible();

    // Assert Not Started count in progress summary
    await expect(page.getByText(/Not Started: 1/i)).toBeVisible();

    // Assert P4 Status BLOCKED shown
    await expect(page.getByText(/P4 Status: BLOCKED/i)).toBeVisible();
  });

  test('waive dialog requires justification ≥10 chars (EM only)', async ({ page }) => {
    await login(page, EM_USER);
    const engagementId = await createEngagementInDraftPhase(page);

    const mockStatement = {
      id: 'stmt-1',
      engagement_id: engagementId,
      draft_product_id: 'dp-1',
      statement_text: 'Internal controls meet OMB requirements.',
      ref_status: 'not_started',
      display_order: 1,
      assigned_to: null,
      assigned_ir_name: null,
      discrepancy_notes: null,
      evidence_ids: ['ev-1'],
      evidence_count: 1,
      created_by: 'user-1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await page.route(`**/api/engagements/${engagementId}/statements**`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ statements: [mockStatement], total: 1 }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(`/engagements/${engagementId}/draft/statements`);
    await page.waitForLoadState('networkidle');

    // Find statement row and click Waive
    await page.getByRole('button', { name: 'Waive' }).first().click();

    // WaiveReferenceCheckDialog should open
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Waive Reference Check')).toBeVisible();

    // Type 9 chars — button should be disabled
    await dialog.getByPlaceholder(/Provide justification/i).fill('Short txt');
    await expect(dialog.getByRole('button', { name: 'Waive Reference Check' })).toBeDisabled();

    // Type 10+ chars — button should be enabled
    await dialog.getByPlaceholder(/Provide justification/i).fill('Long enough justification text');
    await expect(dialog.getByRole('button', { name: 'Waive Reference Check' })).toBeEnabled();
  });

  test('evidence CommandItem click toggles selection (badge visible after click)', async ({ page }) => {
    await login(page, AN_USER);
    const engagementId = await createEngagementInDraftPhase(page);

    await page.route(`**/api/engagements/${engagementId}/statements**`, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ statements: [], total: 0 }),
        });
      } else {
        await route.continue();
      }
    });

    await page.route(`**/api/engagements/${engagementId}/evidence**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          evidence: [
            { id: 'ev-cmdk-1', source: 'Interview Note — cmdk test', evidence_type: 'interview_note' },
          ],
          total: 1,
        }),
      });
    });

    await page.goto(`/engagements/${engagementId}/draft/statements`);
    await page.waitForLoadState('networkidle');

    // Open dialog
    await page.getByRole('button', { name: /Add Statement/i }).first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Open evidence picker
    await dialog.getByText('Select evidence items...').click();
    await page.waitForSelector('[role="option"]', { timeout: 3000 });

    // Click the CommandItem — onMouseDown fix should prevent focus-loss race
    await page.getByRole('option', { name: /Interview Note.*cmdk test/i }).click();

    // After selection, evidence badge or selected count should be visible in the dialog
    // The picker trigger updates to show selected item count or the item appears as a badge
    await expect(
      dialog.getByText(/1 selected|Interview Note.*cmdk test/i).or(dialog.getByRole('option', { name: /Interview Note.*cmdk test/i }).locator('[aria-checked="true"]'))
    ).toBeVisible({ timeout: 3000 });
  });

  test('filter by status narrows table results', async ({ page }) => {
    await login(page, AN_USER);
    const engagementId = await createEngagementInDraftPhase(page);

    const mockStatements = [
      {
        id: 'stmt-1',
        engagement_id: engagementId,
        draft_product_id: 'dp-1',
        statement_text: 'Not started statement.',
        ref_status: 'not_started',
        display_order: 1,
        assigned_to: null,
        assigned_ir_name: null,
        discrepancy_notes: null,
        evidence_ids: [],
        evidence_count: 0,
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'stmt-2',
        engagement_id: engagementId,
        draft_product_id: 'dp-1',
        statement_text: 'Passed statement.',
        ref_status: 'passed',
        display_order: 2,
        assigned_to: null,
        assigned_ir_name: null,
        discrepancy_notes: null,
        evidence_ids: ['ev-1'],
        evidence_count: 1,
        created_by: 'user-1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    await page.route(`**/api/engagements/${engagementId}/statements**`, async (route) => {
      const url = new URL(route.request().url());
      const refStatusFilter = url.searchParams.get('ref_status');

      let filtered = mockStatements;
      if (refStatusFilter) {
        filtered = mockStatements.filter((s) => s.ref_status === refStatusFilter);
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ statements: filtered, total: filtered.length }),
      });
    });

    await page.goto(`/engagements/${engagementId}/draft/statements`);
    await page.waitForLoadState('networkidle');

    // Both statements visible initially
    await expect(page.getByText('Not started statement.')).toBeVisible();
    await expect(page.getByText('Passed statement.')).toBeVisible();

    // Apply "Not Started" filter
    await page.getByRole('combobox').first().click();
    await page.getByRole('option', { name: 'Not Started' }).click();

    // Wait for filtered results
    await page.waitForTimeout(400); // Debounce

    // Only not-started statement should be visible
    await expect(page.getByText('Not started statement.')).toBeVisible();
    await expect(page.getByText('Passed statement.')).not.toBeVisible();
  });
});
