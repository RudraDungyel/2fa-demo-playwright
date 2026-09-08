import { Page, expect } from '@playwright/test';
import { TOTP, NobleCryptoPlugin, ScureBase32Plugin, createGuardrails } from 'otplib';

import fs from 'fs';
import path from 'path';

type UserType = 'user' ;

const envPath = path.resolve(__dirname, '../playwright.env.json');
const env = JSON.parse(fs.readFileSync(envPath, 'utf-8'));

async function getOtp(secret_key: string) {
  if (!secret_key) throw new Error('TOTP_SECRET');
  const totp = new TOTP({
    secret: secret_key,
    crypto: new NobleCryptoPlugin(),
    base32: new ScureBase32Plugin(),
    guardrails: createGuardrails({ MIN_SECRET_BYTES: 1 }),
  });
  return totp.generate();
}

export async function login(page: Page, userType: UserType = 'user') {
  await page.goto('https://github.com/login');
  await page.locator('input[name="login"]').fill(env.user.email);
  await page.locator('input[name="password"]').fill(env.user.password);
  await page.locator('input[type="submit"]').click();
  await expect(page).toHaveURL(/\/sessions\/two-factor\/app/);
  const otp = await getOtp(env.user.secret);
  const otpField = page.locator('#app_totp');
  await otpField.click();
  await otpField.pressSequentially(otp, { delay: 50 });
  await expect(page).toHaveURL('https://github.com/');
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
}