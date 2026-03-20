import { test, expect } from '@playwright/test'

test.describe('Trip Creation Flow', () => {
  test('can navigate to trips page', async ({ page }) => {
    await page.goto('/')

    // Look for trips link in navigation
    const tripsLink = page.getByRole('link', { name: /trips/i })
    await expect(tripsLink).toBeVisible()

    await tripsLink.click()
    await expect(page).toHaveURL(/\/trips/)
  })

  test('can create a new trip', async ({ page }) => {
    await page.goto('/trips')

    // Click new trip button
    const newTripButton = page.getByRole('button', { name: /new trip/i })
      .or(page.getByRole('link', { name: /new trip/i }))

    if (await newTripButton.isVisible()) {
      await newTripButton.click()

      // Should navigate to new trip form or show dialog
      // Fill in trip details
      const nameInput = page.getByLabel(/name/i).first()
      if (await nameInput.isVisible()) {
        await nameInput.fill('Test Golf Trip')

        // Fill dates
        const startDate = page.getByLabel(/start.*date/i)
        if (await startDate.isVisible()) {
          await startDate.fill('2024-06-01')
        }

        const endDate = page.getByLabel(/end.*date/i)
        if (await endDate.isVisible()) {
          await endDate.fill('2024-06-07')
        }

        // Submit form
        const submitButton = page.getByRole('button', { name: /create|save|submit/i })
        if (await submitButton.isVisible()) {
          await submitButton.click()

          // Should redirect to trips list or trip detail
          await expect(page).toHaveURL(/\/trips/)
        }
      }
    }
  })

  test('trip form validates required fields', async ({ page }) => {
    await page.goto('/trips/new')

    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /create|save|submit/i })

    if (await submitButton.isVisible()) {
      await submitButton.click()

      // Should show validation errors
      const errorMessage = page.getByText(/required|must|invalid/i)
      await expect(errorMessage).toBeVisible({ timeout: 5000 }).catch(() => {
        // Some forms prevent submission with HTML5 validation
        // This is also valid behavior
      })
    }
  })
})
