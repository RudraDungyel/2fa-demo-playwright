import { test, expect } from '@playwright/test';
import { login } from '@src/utils';

test.describe('GitHub login with 2FA', () => {

  test('Log in with password and TOTP code', async ({ page }) => {
    await login(page, 'user');
  });

  
});
