# Lessons Learned

## TanStack DB + SSR

**Issue**: TanStack DB collections are client-only. Attempting to use them with SSR enabled causes server-side errors.

**Solution**:
- Add `ssr: false` to all routes that use TanStack DB
- Use a `ClientOnly` wrapper component for browser-dependent code in the root layout
- The root route should NOT have `ssr: false` (it needs to render the HTML shell), but child components that use browser APIs should be wrapped in ClientOnly

**Pattern**:
```tsx
// Route file
export const Route = createFileRoute('/my-route')({
  ssr: false,  // Required for TanStack DB
  component: MyComponent,
})
```

## Collection Iteration

**Issue**: Iterating over a TanStack DB collection returns `[key, value]` tuples, not just values.

**Solution**: Use `.entries()` and destructure:
```tsx
for (const [, item] of collection.entries()) {
  // use item
}
```

## Zod Schema Transforms

**Issue**: When using `.transform()` on schema fields (e.g., string → Date), the input type must accept both forms for `update()` to work with the draft proxy.

**Solution**: Use `z.union()` before transform:
```tsx
const dateField = z
  .union([z.string(), z.date()])
  .transform((val) => (typeof val === 'string' ? new Date(val) : val))
```

## Fish Shell Syntax

**Issue**: This project uses fish shell, not bash.

**Rules**:
- No `for x in ...; do ... done` - use `for x in ...; ...; end`
- No `$()` for command substitution - use `set VAR (command)`
- No `export VAR=value` - use `set -x VAR value`
- Commands separated by `;` on one line may not work as expected

## Jujutsu (jj) for Version Control

**Rule**: Use `jj` commands instead of `git` for all version control operations.

## pnpm over npm

**Rule**: Use `pnpm` for package management, not `npm`.

## No useState

**Rule**: Per project guidelines, use TanStack DB for all state management. For UI-only state, use a local-only collection. However, existing code (ThemeContext) uses useState - should be migrated in future.

## Live Query Dependencies

**Critical**: Always include external reactive values in the dependency array for `useLiveQuery`:
```tsx
// Correct
const { data } = useLiveQuery(
  (q) => q.from({ t: collection }).where(({ t }) => eq(t.userId, userId)),
  [userId]  // Include userId in deps
)
```

## Query Builder Constraints

TanStack DB's query builder has IVM constraints:
- Join conditions must use `eq()` only (equality joins)
- `orderBy` required for `limit`/`offset`
- `distinct` requires `select`
- `having` requires `groupBy`

## Capsize Typography + Radix Gap

**Issue**: Capsize generates aggressive negative margins via `::before`/`::after` pseudo-elements to trim leading/descender space from text. When combined with small Radix gaps, vertically stacked text elements can appear crowded or overlap.

**Guidelines**:

| Context | Recommended Gap | Example |
|---------|-----------------|---------|
| Page headers (title + subtitle) | `gap="3"` or `gap="4"` | Heading + description text |
| Stat displays (label + value) | `gap="2"` | "Golfers" + "10" |
| Card content with multiple sections | `gap="4"` | Title + description + metadata row |
| Form fields (label + input) | `gap="1"` | Label + TextField (OK - inputs aren't capsize-trimmed) |
| List items between cards | `gap="2"` or `gap="3"` | Card list spacing |

**Examples**:
```tsx
// ❌ DON'T - will cause text overlap/crowding
<Flex direction="column" gap="1">
  <Heading size="6">{title}</Heading>
  <Text size="2" color="gray">{subtitle}</Text>
</Flex>

// ✅ DO - page headers need gap="3"
<Flex direction="column" gap="3">
  <Heading size="7">{title}</Heading>
  <Text color="gray">{subtitle}</Text>
</Flex>

// ✅ DO - stat cards need gap="2" minimum
<Flex direction="column" align="center" gap="2">
  <Text size="1" color="gray">Label</Text>
  <Text size="5" weight="bold">{value}</Text>
</Flex>

// ✅ DO - cards with multiple text sections need gap="4"
<Flex direction="column" gap="4">
  <Heading size="4">{title}</Heading>
  <Text color="gray">{description}</Text>
  <Flex gap="4">{metadata}</Flex>
</Flex>
```

**Don't**: Override `line-height` in CSS - capsize computes precise line-heights based on font metrics.

## TanStack Start startInstance Export

**Issue**: TanStack Start's router plugin generates `routeTree.gen.ts` which imports `startInstance` from `./start.ts`. If `start.ts` exists but doesn't export `startInstance`, the app renders a black screen with no React hydration errors.

**Root cause**: The generated code at the bottom of `routeTree.gen.ts` has:
```typescript
import type { startInstance } from './start.ts'
declare module '@tanstack/react-start' {
  interface Register {
    config: Awaited<ReturnType<typeof startInstance.getOptions>>
  }
}
```

**Solution**: Ensure `src/start.ts` exports `startInstance`:
```typescript
// Any custom code (like tidewave import)
if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
  import('tidewave/tanstack');
}

// Required export for TanStack Start
export const startInstance = undefined
```

**Symptom**: Black screen, no console errors, React never hydrates, SSR HTML is rendered but client JS fails silently.

## Radix Card asChild + Flex Gap

**Issue**: When using `<Card asChild>` with a direct `<Flex direction="column">` child, the gap property doesn't work. The Card's `display: block` overrides the Flex's `display: flex`, causing the gap to be ignored even though the CSS classes are merged correctly.

**Diagnosis**: Use browser DevTools to inspect the element:
```javascript
// Check computed styles
getComputedStyle(cardElement).display  // "block" - problem!
getComputedStyle(cardElement).gap      // "48px" - set but ignored
```

**Root cause**: The `asChild` pattern merges classes but CSS specificity causes the Card's `display: block` to win over Flex's `display: flex`.

**Solution**: Don't use `asChild` when you need Flex gap. Nest the Flex inside the Card instead:
```tsx
// ❌ DON'T - gap won't work
<Card asChild>
  <Flex direction="column" gap="5">
    <Heading>{title}</Heading>
    <Text>{description}</Text>
  </Flex>
</Card>

// ✅ DO - gap works correctly
<Card>
  <Flex direction="column" gap="5">
    <Heading>{title}</Heading>
    <Text>{description}</Text>
  </Flex>
</Card>
```

**When asChild IS okay**: For horizontal Flex layouts where you just need `justify-between` and `align-center` without vertical stacking gaps.
