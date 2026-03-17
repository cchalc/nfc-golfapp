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
