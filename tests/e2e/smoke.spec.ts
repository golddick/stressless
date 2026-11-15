import { test, expect } from '@playwright/test'

test('landing page loads with the start button', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Walk in. Scan. Walk out./ })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Start shopping' }).first()).toBeVisible()
})

test('protected pages send you to sign-in', async ({ page }) => {
  await page.goto('/admin')
  await expect(page).toHaveURL(/sign-in/)
})

test('sign-in asks for a code after the identifier (needs DB)', async ({ page }) => {
  test.skip(!process.env.E2E_DB, 'set E2E_DB=1 with a seeded database to run the full journey')
  await page.goto('/sign-in')
  await page.getByLabel('Email or phone').fill('owner@demo.stressless.test')
  await page.getByRole('button', { name: 'Send code' }).click()
  await expect(page.getByText(/6-digit code/)).toBeVisible()
})
