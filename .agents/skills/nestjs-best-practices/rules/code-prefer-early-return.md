# Prefer Early Return and Guard Clauses Rule

This rule enforces using **guard clauses and early returns** across all NestJS services, controllers, guards, filters, and helper methods.

---

## Core Directives

1. **Bouncer Pattern at Function Entry**: Place validations, permission checks, and null checks at the very top of backend methods. Exit early with `return` or throw NestJS HTTP exceptions.
2. **Flatten Happy Path**: Keep main domain logic and database operations at the lowest level of indentation.
3. **No Unnecessary `else`**: Eliminate `else` / `else if` blocks after guard clauses that throw or return.
