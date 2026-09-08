# 2fa-demo E2E

Playwright end-to-end suite with TOTP (2FA) login support.

## Setup

```bash
npm install
npx playwright install
cp playwright.env.example.json playwright.env.json   # then fill in real values
```

`playwright.env.json` holds credentials and is **git-ignored** — never commit it.

## Config file shape

```json
{
  "baseUrl": "https://your-app.example.com",
  "customer": {
    "email": "user+e2e@example.com",
    "password": "<password>",
    "secret": "<base32-totp-secret>"
  }
}
```

Add more roles (`admin`, `manager`, …) as sibling blocks and read them with
`user('admin')`.

Overrides: `BASE_URL` beats `baseUrl`; `PLAYWRIGHT_ENV_FILE` points at a
different config file (e.g. `PLAYWRIGHT_ENV_FILE=playwright.env.staging.json`).

## Commands

| Command | Purpose |
| --- | --- |
| `npm test` | Run all tests headless |
| `npm run test:headed` | Run with a visible browser |
| `npm run e2e:ui` | Playwright UI mode |
| `npm run test:debug` | Step through with the inspector |
| `npm run report` | Open the last HTML report |
| `npm run codegen` | Record selectors against your app |
| `npm run typecheck` | Type-check without emitting |

## Layout

```
playwright.config.ts        Config; baseURL comes from playwright.env.json
src/env.ts                  Typed loader for playwright.env.json
src/totp.ts                 TOTP code generation from a base32 secret
src/utils.ts                Login flows: login(), loginAs(), loginWithOtp()
src/fixtures.ts             `test` extended with `customer` and `loginPage`
src/pages/login.page.ts     Function-based login POM (app-specific locators)
tests/totp.spec.ts          Verifies the TOTP helper — runs today
tests/login.spec.ts         Login journey template — currently skipped
```

## Writing a test

```ts
import { test, expect } from '../src/fixtures';
import { login } from '../src/utils';

test('reaches the dashboard', async ({ page, customer }) => {
  await login(page, customer);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
```

Page objects are plain factory functions — call `loginPage(page)` for its
locators and steps, or take the `loginPage` fixture:

```ts
test('shows the 2FA step', async ({ loginPage, customer }) => {
  await loginPage.goto();
  await loginPage.fillCredentials(customer.email, customer.password);
  await expect(loginPage.otpInput.first()).toBeVisible();
});
```

`freshTotp()` waits for the next window if the current code has under 5 seconds
left, so codes don't rotate between typing and submitting.
