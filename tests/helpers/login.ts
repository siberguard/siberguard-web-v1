import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

export async function login({
  page,
  serverURL = 'http://localhost:3000',
  user,
}: {
  page: Page
  serverURL?: string
  user: { email: string; password: string }
}) {
  await page.goto(`${serverURL}/admin/login`)
  await page.fill('#field-email', user.email)
  await page.fill('#field-password', user.password)
  await page.click('button[type="submit"]')
  await page.waitForURL(`${serverURL}/admin`)
  await expect(page.getByRole('heading', { name: 'Ringkasan' })).toBeVisible()
}
