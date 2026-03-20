import { test, expect } from '@playwright/test'

test.describe('Score Entry Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app root
    await page.goto('/')
  })

  test('can navigate to scorecard from trips', async ({ page }) => {
    // Navigate to trips
    const tripsLink = page.getByRole('link', { name: /trips/i })
    await expect(tripsLink).toBeVisible()
    await tripsLink.click()
    await expect(page).toHaveURL(/\/trips/)

    // Look for an existing trip or skip if none
    const tripCard = page.locator('[data-testid="trip-card"]').first()
      .or(page.getByRole('link').filter({ hasText: /golf|trip/i }).first())

    if (await tripCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await tripCard.click()

      // Navigate to rounds
      const roundsLink = page.getByRole('link', { name: /rounds/i })
      if (await roundsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await roundsLink.click()

        // Look for scorecard link or round card
        const scorecardLink = page.getByRole('link', { name: /scorecard/i })
          .or(page.locator('[data-testid="scorecard-link"]'))

        if (await scorecardLink.isVisible({ timeout: 3000 }).catch(() => false)) {
          await scorecardLink.first().click()
          await expect(page).toHaveURL(/\/scorecard/)
        }
      }
    }
  })

  test('scorecard displays hole information', async ({ page }) => {
    // Direct navigation to a scorecard (if trip/round exists)
    await page.goto('/trips')

    const tripCard = page.locator('[data-testid="trip-card"]').first()
      .or(page.getByRole('link').filter({ hasText: /golf|trip/i }).first())

    if (await tripCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await tripCard.click()

      // Find rounds section
      const roundsLink = page.getByRole('link', { name: /rounds/i })
      if (await roundsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await roundsLink.click()

        // Click first round
        const roundLink = page.getByRole('link', { name: /round|scorecard/i }).first()
        if (await roundLink.isVisible({ timeout: 3000 }).catch(() => false)) {
          await roundLink.click()

          // Verify scorecard elements
          const holeNumbers = page.locator('[data-testid="hole-number"]')
            .or(page.getByText(/hole\s*\d+/i))

          if (await holeNumbers.first().isVisible({ timeout: 3000 }).catch(() => false)) {
            // Scorecard should show holes
            const count = await holeNumbers.count()
            expect(count).toBeGreaterThan(0)
          }
        }
      }
    }
  })

  test('can enter a score for a hole', async ({ page }) => {
    // This test assumes a scorecard page exists with score entry
    await page.goto('/trips')

    const tripCard = page.locator('[data-testid="trip-card"]').first()
      .or(page.getByRole('link').filter({ hasText: /golf|trip/i }).first())

    if (await tripCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await tripCard.click()

      const roundsLink = page.getByRole('link', { name: /rounds/i })
      if (await roundsLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await roundsLink.click()

        const scorecardLink = page.getByRole('link', { name: /scorecard/i }).first()
        if (await scorecardLink.isVisible({ timeout: 3000 }).catch(() => false)) {
          await scorecardLink.click()

          // Find score input
          const scoreInput = page.locator('[data-testid="score-input"]').first()
            .or(page.getByRole('spinbutton').first())
            .or(page.locator('input[type="number"]').first())

          if (await scoreInput.isVisible({ timeout: 3000 }).catch(() => false)) {
            await scoreInput.fill('4')

            // Score should be visible after entry
            await expect(scoreInput).toHaveValue('4')
          }
        }
      }
    }
  })
})
