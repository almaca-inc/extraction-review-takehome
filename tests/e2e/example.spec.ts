import { expect, test } from '@playwright/test'

test('the document and the fields both load', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('ALM-2025-0417')
  await expect(page.getByAltText('Passport — data page')).toBeVisible()
})
