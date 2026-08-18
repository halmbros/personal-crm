const { test, expect } = require('@playwright/test');

test.describe('Personal CRM - Visual Interface', () => {

  test('page loads with header, search, and action buttons', async ({ page }) => {
    await page.goto('/');

    // Header
    await expect(page.locator('h1')).toHaveText('Personal CRM');

    // Search box
    const search = page.locator('#search');
    await expect(search).toBeVisible();
    await expect(search).toHaveAttribute('placeholder', 'Search contacts...');

    // Action buttons
    await expect(page.locator('#btn-auth')).toBeVisible();
    await expect(page.locator('.btn-digest')).toBeVisible();
    await expect(page.locator('#btn-refresh')).toBeVisible();
  });

  test('status bar shows loading then resolves', async ({ page }) => {
    await page.goto('/');

    const statusText = page.locator('#status-text');
    // Should eventually show either a success or error status (API key may not work in test)
    await expect(statusText).not.toHaveText('Loading...', { timeout: 15000 });
  });

  test('legend displays all urgency categories', async ({ page }) => {
    await page.goto('/');

    const legend = page.locator('.legend');
    await expect(legend).toBeVisible();
    await expect(legend.locator('.legend-item')).toHaveCount(5);

    const labels = ['Chase + Overdue', 'Chase/Reach Out', 'Undecided / Due Soon', 'Hold', 'Future (7+ days)'];
    for (const label of labels) {
      await expect(legend.locator('.legend-item', { hasText: label })).toBeVisible();
    }
  });

  test('dark mode styles are applied', async ({ page }) => {
    await page.goto('/');

    const bodyBg = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor
    );
    // #0f0f14 = rgb(15, 15, 20)
    expect(bodyBg).toBe('rgb(15, 15, 20)');

    const headerBg = await page.evaluate(() =>
      getComputedStyle(document.querySelector('.header')).backgroundColor
    );
    // #16161e = rgb(22, 22, 30)
    expect(headerBg).toBe('rgb(22, 22, 30)');
  });

  test('data loads and sections render with contacts', async ({ page }) => {
    await page.goto('/');

    // Wait for data to load (sections appear)
    const section = page.locator('.section').first();
    await expect(section).toBeVisible({ timeout: 15000 });

    // Section headers should have a title and count badge
    await expect(section.locator('.section-title')).toBeVisible();
    await expect(section.locator('.section-count')).toBeVisible();

    // At least one table with contact rows should exist
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 5000 });
  });

  test('search filters contacts', async ({ page }) => {
    await page.goto('/');

    // Wait for data to load
    await expect(page.locator('.section').first()).toBeVisible({ timeout: 15000 });

    const totalBefore = await page.locator('tbody tr').count();

    // Type a gibberish search to filter everything out
    await page.fill('#search', 'zzzznonexistent99999');
    // Brief wait for filtering
    await page.waitForTimeout(500);

    // All sections should show "No matches."
    const emptyStates = page.locator('.empty-state', { hasText: 'No matches.' });
    const emptyCount = await emptyStates.count();
    expect(emptyCount).toBeGreaterThan(0);

    // Clear search restores contacts
    await page.fill('#search', '');
    await page.waitForTimeout(500);
    const totalAfter = await page.locator('tbody tr').count();
    expect(totalAfter).toBe(totalBefore);
  });

  test('clicking a contact opens the detail panel', async ({ page }) => {
    await page.goto('/');

    // Wait for contacts to load
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });

    // Click first contact row
    await page.locator('tbody tr').first().click();

    // Detail panel should slide in
    const panel = page.locator('#detail-panel');
    await expect(panel).toHaveClass(/open/);
    await expect(page.locator('#overlay')).toHaveClass(/open/);

    // Panel should contain editable fields
    await expect(panel.locator('.detail-field').first()).toBeVisible();

    // Save button and sheet link should be visible
    await expect(page.locator('#btn-save')).toBeVisible();
    await expect(page.locator('.btn-sheet-link')).toBeVisible();
  });

  test('detail panel closes on X button', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });

    await page.locator('tbody tr').first().click();
    await expect(page.locator('#detail-panel')).toHaveClass(/open/);

    // Close via X button
    await page.locator('.detail-panel-close').click();
    await expect(page.locator('#detail-panel')).not.toHaveClass(/open/);
  });

  test('Today\'s Digest modal opens and closes', async ({ page }) => {
    await page.goto('/');

    // Wait for data to load so digest has content
    await expect(page.locator('#status-dot')).not.toHaveClass(/loading/, { timeout: 15000 });

    // Open digest
    await page.locator('.btn-digest').click();
    const digest = page.locator('#digest-modal');
    await expect(digest).toHaveClass(/open/);
    await expect(page.locator('#digest-title')).toContainText('Daily Digest');

    // Close digest
    await page.locator('.digest-close').click();
    await expect(digest).not.toHaveClass(/open/);
  });

  test('full page screenshot - loaded state', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.section').first()).toBeVisible({ timeout: 15000 });

    // Take a full-page screenshot for visual baseline
    await page.screenshot({ path: 'tests/screenshots/crm-loaded.png', fullPage: true });
  });

  test('full page screenshot - digest open', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#status-dot')).not.toHaveClass(/loading/, { timeout: 15000 });

    await page.locator('.btn-digest').click();
    await expect(page.locator('#digest-modal')).toHaveClass(/open/);

    await page.screenshot({ path: 'tests/screenshots/crm-digest.png', fullPage: true });
  });

  test('full page screenshot - detail panel open', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 15000 });

    await page.locator('tbody tr').first().click();
    await expect(page.locator('#detail-panel')).toHaveClass(/open/);

    await page.screenshot({ path: 'tests/screenshots/crm-detail-panel.png', fullPage: true });
  });
});
