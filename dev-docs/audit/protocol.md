# Audit Protocol

## What to Check

Each agent audits its assigned chunk for these categories:

### 1. Rule Compliance (from AGENTS.md + .claude/rules/)
- Zustand store destructuring in components (should use selectors)
- Files over ~300 lines
- Hardcoded colors instead of CSS tokens
- `[data-theme="night"]` instead of `.dark-theme`
- Missing focus indicators (`:focus-visible`)
- Bare `console.log` instead of debug loggers
- `error as Error` unsafe casts (should use `instanceof`)
- `../../../` import chains (should use `@/`)
- Anonymous event listeners without cleanup refs

### 2. Code Quality
- Dead code (unused exports, unreachable branches)
- Code duplication (similar logic in multiple places)
- Over-complex functions (too many responsibilities)
- Missing error handling at system boundaries
- Anti-patterns specific to the tech stack

### 3. Security
- Command injection risks
- XSS vectors (dangerouslySetInnerHTML, unescaped user input)
- Path traversal
- Unsafe deserialization

### 4. Architecture
- Cross-feature imports that should be shared
- Circular dependencies
- Plugin styles leaking into global CSS
- Convention drift from documented patterns

## Output Format

Write findings to `dev-docs/audit/chunk-NAME.md` using this format:

```markdown
# Audit: [Chunk Name]

**Scope:** directories audited
**Files scanned:** N
**Findings:** N

## Critical (must fix)
### [C1] Title
- **File:** path:line
- **Issue:** description
- **Fix:** suggested fix

## Warning (should fix)
### [W1] Title
...

## Info (consider)
### [I1] Title
...

## Summary
- Critical: N
- Warning: N
- Info: N
- Healthiest areas: ...
- Most concerning areas: ...
```

## Severity Definitions
- **Critical**: Security risk, data loss potential, or crash-causing bug
- **Warning**: Convention violation, dead code, maintainability issue
- **Info**: Suggestion for improvement, minor inconsistency
