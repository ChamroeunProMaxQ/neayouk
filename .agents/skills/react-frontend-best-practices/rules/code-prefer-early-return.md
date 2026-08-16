# Prefer Early Return and Guard Clauses

This rule enforces using **guard clauses and early returns** across all React components, custom hooks, and utility functions to reduce nesting and eliminate unnecessary `else` blocks.

---

## Core Directives

1. **Bouncer Pattern at Entry**: Evaluate preconditions, null checks, and error guards at the top of functions. Exit early with `return`, `throw`, `break`, or `continue`.
2. **Flatten Happy Path**: Keep main UI rendering and primary logic at the lowest level of indentation.
3. **No Unnecessary `else`**: Omit `else` blocks following an early `return` statement.
