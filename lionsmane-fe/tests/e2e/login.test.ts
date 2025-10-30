import { expect, test } from '@playwright/test';

test('logs in', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.getByRole('textbox', { name: 'email' }).click();
  await page.getByRole('textbox', { name: 'email' }).fill('mmiller@wer.com');
  await page.getByRole('textbox', { name: 'password' }).click();
  await page
    .getByRole('textbox', { name: 'password' })
    .fill('ajfkajdskfj34223421!');
  await page.getByRole('button', { name: 'Submit' }).click();

  await page.waitForURL('http://localhost:3000/dashboard');
  expect(page.url()).toBe('http://localhost:3000/dashboard');
});
