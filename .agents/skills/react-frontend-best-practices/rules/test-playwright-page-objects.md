---
title: Structure E2E Tests using the Playwright Page Object Model Pattern
impact: MEDIUM-HIGH
impactDescription: Prevents selector duplication and simplifies end-to-end test maintenance when UI layouts change.
tags: testing, playwright, e2e, page-object-model
---

## Structure E2E Tests using the Playwright Page Object Model Pattern

**Impact: MEDIUM-HIGH (Reduces E2E test suite maintenance overhead by 80%)**

Hardcoding CSS selectors (`page.click('.btn-submit')`) and raw navigation URLs directly inside every E2E Playwright test spec file creates widespread test maintenance headaches whenever component markup or class names change.

Structure Playwright E2E tests using the **Page Object Model (POM)** pattern. Encapsulate page element locators and action methods inside reusable Page classes.

**Incorrect (Hardcoding selectors directly in spec files):**

```typescript
// ❌ Bad: Duplicating locators directly in spec file
test('user logs in', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.fill('#email', 'admin@example.com');
  await page.fill('#password', 'secret');
  await page.click('button[type="submit"]');
  await expect(page.locator('.dashboard-title')).toBeVisible();
});
```

**Correct (Page Object Model pattern implementation):**

```typescript
// 1. Page Object Class (e2e/pages/login-page.ts)
import { type Page, type Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByRole('textbox', { name: /email/i });
    this.passwordInput = page.getByLabel(/password/i);
    this.submitButton = page.getByRole('button', { name: /log in/i });
    this.errorMessage = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, pass: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(pass);
    await this.submitButton.click();
  }
}

// 2. Playwright Test Spec (e2e/specs/login.spec.ts)
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/login-page';

test.describe('Authentication Journey', () => {
  test('successful user login redirects to dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login('user@example.com', 'ValidPass123!');

    // Assert URL navigation and visible UI state
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });
});
```

Reference: [Playwright - Page Object Model Guide](https://playwright.dev/docs/pom)
