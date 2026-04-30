```markdown
# nfc-golfapp Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches you the core development patterns and conventions used in the `nfc-golfapp` TypeScript codebase. You'll learn about file naming, import/export styles, commit conventions, and how to write and run tests. This guide also suggests useful commands for common workflows.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `userProfile.ts`, `gameManager.ts`

### Import Style
- Use **relative imports** for referencing modules.
  - Example:
    ```typescript
    import { getPlayerScore } from './scoreUtils';
    ```

### Export Style
- Use **named exports** exclusively.
  - Example:
    ```typescript
    // In scoreUtils.ts
    export function getPlayerScore() { ... }
    export const MAX_SCORE = 100;
    ```

### Commit Messages
- Follow the **Conventional Commits** standard.
- Use the `feat` prefix for new features.
- Keep commit messages concise (average 41 characters).
  - Example:
    ```
    feat: add player handicap calculation
    ```

## Workflows

### Feature Development
**Trigger:** When implementing a new feature  
**Command:** `/feature-development`

1. Create a new branch for your feature.
2. Write code using camelCase file names and relative imports.
3. Use named exports for all modules.
4. Write or update relevant tests (`*.test.*` files).
5. Commit changes using the `feat` prefix and a concise message.
6. Open a pull request for review.

### Testing
**Trigger:** Before merging code or verifying functionality  
**Command:** `/run-tests`

1. Identify test files matching the `*.test.*` pattern.
2. Run the test suite using the project's test runner (framework unknown; check project scripts).
3. Review test results and fix any failing tests.

## Testing Patterns

- Test files are named with the `*.test.*` pattern (e.g., `scoreUtils.test.ts`).
- The testing framework is not specified; check project scripts or documentation for details.
- Place test files alongside the modules they test or in a dedicated test directory.

**Example test file:**
```typescript
// scoreUtils.test.ts
import { getPlayerScore } from './scoreUtils';

describe('getPlayerScore', () => {
  it('returns correct score for valid input', () => {
    expect(getPlayerScore(/* args */)).toBe(/* expected */);
  });
});
```

## Commands
| Command               | Purpose                                   |
|-----------------------|-------------------------------------------|
| /feature-development  | Start the feature development workflow    |
| /run-tests            | Run all tests in the codebase             |
```
