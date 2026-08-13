---
title: Enforce Zero-Overhead Code Formatting using `oxfmt`
impact: LOW-MEDIUM
impactDescription: Guarantees unified code style formatting with ultra-fast Rust-native performance.
tags: tooling, oxfmt, formatting, code-style
---

## Enforce Zero-Overhead Code Formatting using `oxfmt`

**Impact: LOW-MEDIUM (Eliminates code style formatting debates and speeds up git pre-commit hooks)**

Inconsistent code formatting (tab spaces, single vs double quotes, trailing commas, line widths) creates noisy git diffs and code review friction across engineering teams.

Use **oxfmt** for instant, zero-configuration formatting compatible with standard Prettier configurations.

**Formatting Configuration (`.oxfmtrc.json` / `prettier.config.js`):**

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "jsxSingleQuote": false,
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

**Package Script Integration (`package.json`):**

```json
{
  "scripts": {
    "format": "oxfmt --write src/",
    "format:check": "oxfmt --check src/"
  }
}
```

**Git Pre-commit Hook Integration (`.husky/pre-commit`):**

```bash
#!/bin/sh
npx oxlint --fix src/
npx oxfmt --write src/
```

Reference: [Oxc Tooling Ecosystem](https://oxc.rs/)
