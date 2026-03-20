/**
 * Navigation state extractors for Bombadil specs
 */
import { extract, type Cell } from '@antithesishq/bombadil'

// Current URL path
export const currentPath: Cell<string> = extract((state) => {
  return state.window.location.pathname
})

// Current URL search params (JSON-compatible)
export const searchParams: Cell<{ [key: string]: string }> = extract((state) => {
  const params: { [key: string]: string } = {}
  const searchParams = new URLSearchParams(state.window.location.search)
  searchParams.forEach((value, key) => {
    params[key] = value
  })
  return params
})

// Check if page is loading (skeleton visible)
export const isLoading: Cell<boolean> = extract((state) => {
  const skeletons = state.document.querySelectorAll('[data-loading="true"], .skeleton')
  return skeletons.length > 0
})

// Check if error boundary is showing
export const hasError: Cell<boolean> = extract((state) => {
  const errorBoundary = state.document.querySelector('[data-testid="error-boundary"]')
  const errorDisplay = state.document.querySelector('[data-testid="error-display"]')
  return errorBoundary !== null || errorDisplay !== null
})

// Get all navigation links
export const navLinks: Cell<string[]> = extract((state) => {
  const links = state.document.querySelectorAll('a[href]')
  const hrefs: string[] = []
  links.forEach((link) => {
    const href = link.getAttribute('href')
    if (href && href.startsWith('/')) {
      hrefs.push(href)
    }
  })
  return hrefs
})

// Check if back button is available
export const canGoBack: Cell<boolean> = extract((state) => {
  return state.window.history.length > 1
})

// Get page title
export const pageTitle: Cell<string> = extract((state) => {
  return state.document.title || ''
})

// Get all visible headings (for accessibility check)
export const visibleHeadings: Cell<string[]> = extract((state) => {
  const headings = state.document.querySelectorAll('h1, h2, h3, h4, h5, h6')
  const texts: string[] = []
  headings.forEach((h) => {
    const text = h.textContent?.trim()
    if (text) texts.push(text)
  })
  return texts
})
