/**
 * Form interaction generators for Bombadil specs
 *
 * These generators produce actions for form interactions.
 */
import { actions, type Action, type ActionGenerator } from '@antithesishq/bombadil'
import { randomGolferName, randomHandicap } from '../fixtures/golfers'

/**
 * Generate golfer form fill actions
 */
export const fillGolferForm: ActionGenerator = actions(() => {
  const result: Action[] = [
    {
      TypeText: {
        text: randomGolferName(),
        delayMillis: 30,
      },
    },
    { PressKey: { code: 9 } }, // Tab
    {
      TypeText: {
        text: `test${Math.floor(Math.random() * 10000)}@test.com`,
        delayMillis: 30,
      },
    },
    { PressKey: { code: 9 } }, // Tab
    {
      TypeText: {
        text: randomHandicap().toString(),
        delayMillis: 30,
      },
    },
  ]
  return result
})

/**
 * Generate trip form fill actions
 */
export const fillTripForm: ActionGenerator = actions(() => {
  const tripNames = ['Spring Classic', 'Summer Open', "Buddy's Trip", 'Annual Outing']
  const tripName = tripNames[Math.floor(Math.random() * tripNames.length)]

  // Generate valid date range
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() + Math.floor(Math.random() * 30) + 1)
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + Math.floor(Math.random() * 7) + 1)

  const formatDate = (d: Date) => d.toISOString().split('T')[0]

  const result: Action[] = [
    {
      TypeText: {
        text: tripName,
        delayMillis: 30,
      },
    },
    { PressKey: { code: 9 } }, // Tab
    {
      TypeText: {
        text: formatDate(startDate),
        delayMillis: 30,
      },
    },
    { PressKey: { code: 9 } }, // Tab
    {
      TypeText: {
        text: formatDate(endDate),
        delayMillis: 30,
      },
    },
  ]
  return result
})

/**
 * Generate form submission actions
 */
export const submitForms: ActionGenerator = actions(() => {
  const result: Action[] = [
    { PressKey: { code: 13 } }, // Enter to submit
    { PressKey: { code: 9 } }, // Tab
    'Wait',
  ]
  return result
})

/**
 * Generate dialog open/close actions
 */
export const interactWithDialogs: ActionGenerator = actions(() => {
  const result: Action[] = [
    { PressKey: { code: 27 } }, // Escape to close
    { PressKey: { code: 13 } }, // Enter to confirm
    'Wait',
  ]
  return result
})
