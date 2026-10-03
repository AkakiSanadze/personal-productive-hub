import { expect, test, type Page } from '@playwright/test';

const PRICES = {
  bitcoin: { usd: 65000, usd_24h_change: 1.5 },
  ethereum: { usd: 3200.5, usd_24h_change: -0.7 },
};

async function open(page: Page, legacy?: Record<string, string>) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route('https://api.coingecko.com/**', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PRICES) }),
  );
  await page.addInitScript(
    ([data]) => {
      if (data && !sessionStorage.getItem('seeded')) {
        localStorage.clear();
        for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v);
        sessionStorage.setItem('seeded', '1');
      }
      Object.defineProperty(navigator, 'language', { get: () => 'ka-GE' });
    },
    [legacy ?? {}],
  );
  await page.goto('/');
  await expect(page.locator('html.ready')).toBeAttached();
  return errors;
}

test('loads without errors and renders every widget', async ({ page }) => {
  const errors = await open(page);
  await expect(page.locator('#clock')).toHaveText(/\d\d:\d\d:\d\d/);
  await expect(page.locator('#greeting')).not.toBeEmpty();
  await expect(page.locator('.crypto-item')).toHaveCount(8);
  await expect(page.locator('.crypto-item').first()).toContainText('$65,000');
  await expect(page.locator('#timer')).toHaveText('25:00');
  expect(errors).toEqual([]);
});

test('todos: add, toggle, persist across reload, delete', async ({ page }) => {
  await open(page);
  await page.fill('#todoInput', 'Write tests');
  await page.press('#todoInput', 'Enter');
  const item = page.locator('.todo-item', { hasText: 'Write tests' });
  await expect(item).toBeVisible();
  await item.locator('.todo-checkbox').click();
  await expect(item).toHaveClass(/completed/);

  await page.reload();
  await expect(page.locator('.todo-item.completed', { hasText: 'Write tests' })).toBeVisible();

  await page.locator('.todo-item', { hasText: 'Write tests' }).hover();
  await page.locator('.todo-item', { hasText: 'Write tests' }).locator('.todo-delete').click();
  await expect(page.locator('.todo-item')).toHaveCount(0);
});

test('links reject javascript: URLs and accept normal ones', async ({ page }) => {
  await open(page);
  await page.fill('#linkName', 'Evil');
  await page.fill('#linkUrl', 'javascript:alert(1)');
  await page.press('#linkUrl', 'Enter');
  await expect(page.locator('.link-item')).toHaveCount(0);

  await page.fill('#linkName', 'GitHub');
  await page.fill('#linkUrl', 'github.com');
  await page.press('#linkUrl', 'Enter');
  await expect(page.locator('.link-anchor')).toHaveAttribute('href', 'https://github.com/');
});

test('pomodoro start/pause works and survives reload', async ({ page }) => {
  await open(page);
  await page.click('#startBtn');
  await page.waitForTimeout(1600);
  await expect(page.locator('#timer')).toHaveText(/24:5\d/);
  await page.reload();
  await expect(page.locator('#timer')).toHaveText(/24:5\d/);
  await page.click('#startBtn'); // pause
  const paused = await page.locator('#timer').textContent();
  await page.waitForTimeout(1300);
  await expect(page.locator('#timer')).toHaveText(paused!);
  await page.click('[data-mode="break"]');
  await expect(page.locator('#timer')).toHaveText('05:00');
});

test('countdown finishes and rings', async ({ page }) => {
  await open(page);
  await page.fill('#countdownLabel', 'Tea');
  await page.fill('#countdownSeconds', '1');
  await page.press('#countdownSeconds', 'Enter');
  const row = page.locator('.countdown-item', { hasText: 'Tea' });
  await expect(row).toBeVisible();
  await expect(row).toHaveClass(/ringing/, { timeout: 4000 });
  await row.locator('[data-action="silence"]').click();
  await expect(row).not.toHaveClass(/ringing/);
});

test('language switch translates UI and persists', async ({ page }) => {
  await open(page);
  await expect(page.locator('#todos-title')).toContainText('დავალებები');
  await page.click('#langBtn');
  await expect(page.locator('#todos-title')).toContainText('Tasks');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.reload();
  await expect(page.locator('#todos-title')).toContainText('Tasks');
});

test('migrates data from the original single-file app', async ({ page }) => {
  await open(page, {
    todos: JSON.stringify([{ text: 'Legacy task', completed: false }]),
    links: JSON.stringify([{ name: 'Old link', url: 'https://example.com' }]),
    quickNotes: 'legacy note',
    theme: 'light',
  });
  await expect(page.locator('.todo-item', { hasText: 'Legacy task' })).toBeVisible();
  await expect(page.locator('.link-name', { hasText: 'Old link' })).toBeVisible();
  await expect(page.locator('#notesTextarea')).toHaveValue('legacy note');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
