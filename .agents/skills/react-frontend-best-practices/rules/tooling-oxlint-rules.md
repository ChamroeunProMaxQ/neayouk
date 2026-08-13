---
title: Configure High-Speed `oxlint` Rules for React, TypeScript, and JSX A11y
impact: LOW-MEDIUM
impactDescription: Delivers 50x-100x faster linting feedback compared to legacy ESLint configurations.
tags: tooling, oxlint, linting, code-quality, performance
---

## Configure High-Speed `oxlint` Rules for React, TypeScript, and JSX A11y

**Impact: LOW-MEDIUM (Provides sub-second linting speed across large React codebases)**

Legacy ESLint setups can take 30-60 seconds to run on large monorepos, slowing down CI/CD pipelines and local pre-commit hooks.

Use **oxlint** (part of the Ox environment toolchain) for sub-second, Rust-powered linting. Enable strict React rules, JSX accessibility (`jsx-a11y`), and TypeScript correctness plugins.

**Oxlint Configuration (`.oxlintrc.json`):**

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "jsx-a11y", "typescript", "unicorn"],
  "categories": {
    "correctness": "warn",
    "perf": "error"
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/exhaustive-deps": "warn",
    "react/jsx-no-target-blank": "error",
    "react/jsx-key": "error",
    "jsx-a11y/alt-text": "error",
    "jsx-a11y/anchor-is-valid": "error",
    "typescript/no-explicit-any": "error",
    "typescript/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  },
  "ignorePatterns": ["dist", "build", "coverage", "node_modules"]
}
```

**Package Script Integration (`package.json`):**

```json
{
  "scripts": {
    "lint": "oxlint --config .oxlintrc.json src/",
    "lint:fix": "oxlint --config .oxlintrc.json --fix src/"
  }
}
```

Reference: [oxlint Documentation](https://oxc.rs/docs/tools/linter.html)
