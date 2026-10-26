import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import path from 'node:path';
const rolesClaim =
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
const nameClaim = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';
function session(
  role: string | string[] = 'ADMINISTRATOR',
  expires = Math.floor(Date.now() / 1000) + 1800,
) {
  const claims = {
    email: 'admin@example.com',
    [rolesClaim]: role,
    [nameClaim]: 'admin',
    exp: expires,
  };
  return {
    token:
      Buffer.from('{}').toString('base64url') +
      '.' +
      Buffer.from(JSON.stringify(claims)).toString('base64url') +
      '.test',
    expiration: new Date(expires * 1000).toISOString(),
    email: claims.email,
    userName: 'admin',
    roles: Array.isArray(role) ? role : [role],
  };
}
async function login(page: Page, role: string | string[] = 'ADMINISTRATOR') {
  await page.route('**/api/user/login', (route) =>
    route.fulfill({ json: session(role) }),
  );
  await page.goto('/login');
  await page
    .getByLabel('Correo electrónico', { exact: true })
    .fill('admin@example.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('Example!123');
  await page.getByRole('button', { name: 'Entrar a mi espacio' }).click();
  await expect(page).toHaveURL(/dashboard/);
}
async function openUsers(page: Page) {
  await page.getByRole('navigation').hover();
  await page
    .getByRole('button', { name: 'Administrador', exact: true })
    .click();
  await page.getByRole('link', { name: 'Usuarios', exact: true }).click();
}
const users = [
  { userName: 'ana', email: 'ana@example.com', isActive: true },
  { userName: 'diego', email: 'diego@example.com', isActive: false },
];
async function mockUsers(page: Page) {
  await page.route('**/api/rol**', (route) =>
    route.fulfill({
      json: {
        items: [
          { id: 'admin-role', name: 'ADMINISTRATOR' },
          { id: 'member-role', name: 'userNormal' },
        ],
        total: 2,
      },
    }),
  );
  await page.route('**/api/user?**', (route) => {
    const url = new URL(route.request().url());
    const empty = url.searchParams.get('UserNameCont') === 'missing';
    return route.fulfill({
      json: {
        items: empty ? [] : users,
        total: empty ? 0 : 25,
        index: Number(url.searchParams.get('pageNumber') ?? 1),
        totalPages: 3,
      },
    });
  });
}
test('protected routes redirect unauthenticated users', async ({ page }) => {
  await page.goto('/session/user-home');
  await expect(page).toHaveURL(/login/);
  await expect(
    page.getByRole('heading', { name: 'Inicia sesión' }),
  ).toBeVisible();
});
test('invalid login keeps inline errors and focuses the first invalid field', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Entrar a mi espacio' }).click();
  await expect(page.getByText('Ingresa tu correo electrónico.')).toBeVisible();
  await expect(
    page.getByLabel('Correo electrónico', { exact: true }),
  ).toBeFocused();
});
test('password visibility is keyboard accessible', async ({ page }) => {
  await page.goto('/login');
  const password = page.getByLabel('Contraseña', { exact: true });
  await password.fill('Example!123');
  await page.getByRole('button', { name: 'Mostrar contraseña' }).press('Enter');
  await expect(password).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Ocultar contraseña' }).press('Enter');
  await expect(password).toHaveAttribute('type', 'password');
});
test('failed login preserves the form and allows retry without unhandled errors', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/api/user/login', (route) =>
    route.fulfill({
      status: 400,
      json: { message: 'Credenciales inválidas.' },
    }),
  );
  await page.goto('/login');
  await page
    .getByLabel('Correo electrónico', { exact: true })
    .fill('admin@example.com');
  await page.getByLabel('Contraseña', { exact: true }).fill('Example!123');
  await page.getByRole('button', { name: 'Entrar a mi espacio' }).click();
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(
    page.getByLabel('Correo electrónico', { exact: true }),
  ).toHaveValue('admin@example.com');
  await expect(page.getByLabel('Contraseña', { exact: true })).toHaveValue(
    'Example!123',
  );
  await expect(
    page.getByRole('button', { name: 'Entrar a mi espacio' }),
  ).toBeEnabled();
  expect(errors).toEqual([]);
});
test('registration has a working date adapter and recovery has an accessible email label', async ({
  page,
}) => {
  await page.goto('/login');
  await page
    .getByRole('button', { name: 'Crea tu cuenta', exact: true })
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page
    .getByRole('button', { name: 'Open calendar', exact: true })
    .click();
  await expect(page.locator('mat-calendar')).toBeVisible();
  await page.locator('mat-calendar .mat-calendar-body-cell').first().click();
  await expect(page.locator('mat-calendar')).toHaveCount(0);
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.getByRole('button', { name: '¿Olvidaste tu contraseña?' }).click();
  await expect(
    page.getByRole('dialog').getByLabel('Correo electrónico', { exact: true }),
  ).toBeVisible();
});
test('login handles a single role and reload restores the navigation', async ({
  page,
}) => {
  await login(page);
  await page.getByRole('navigation').hover();
  await expect(
    page.getByRole('button', { name: 'Administrador', exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Dashboard', exact: true }),
  ).toBeVisible();
  await openUsers(page);
  await expect(page).toHaveURL(/user-home$/);
});
test('expired persisted sessions are discarded', async ({ page }) => {
  await page.goto('/login');
  await page.evaluate(
    (auth) =>
      localStorage.setItem(
        'plantilla:auth',
        JSON.stringify({ value: auth, expires: Date.now() + 3600000 }),
      ),
    session('ADMINISTRATOR', Math.floor(Date.now() / 1000) - 60),
  );
  await page.goto('/session/dashboard');
  await expect(page).toHaveURL(/login/);
});
test('members do not see administrative links', async ({ page }) => {
  await login(page, 'userNormal');
  await expect(
    page.getByRole('link', { name: 'Usuarios', exact: true }),
  ).toHaveCount(0);
  await page.goto('/session/user-home');
  await expect(page).toHaveURL(/dashboard/);
});

test('the original image picker remains available', async ({ page }) => {
  await page.goto('/login');
  const chooser = page.waitForEvent('filechooser');
  await page
    .getByRole('button', { name: 'Insertar imagen', exact: true })
    .click();
  const picker = await chooser;
  expect(picker.isMultiple()).toBe(false);
  await picker.setFiles({
    name: 'imagen.png',
    mimeType: 'image/png',
    buffer: Buffer.from('test'),
  });
  await expect(
    page.getByRole('button', { name: 'imagen.png', exact: true }),
  ).toBeVisible();
});
test('user filters remain usable after an empty result and pagination keeps the filter', async ({
  page,
}) => {
  await mockUsers(page);
  await login(page);
  await openUsers(page);
  await page.getByLabel('Nombre de usuario', { exact: true }).fill('ana');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  const request = page.waitForRequest(
    (r) =>
      r.url().includes('/api/user?') &&
      new URL(r.url()).searchParams.get('pageNumber') === '2',
  );
  await page.getByRole('button', { name: 'Página siguiente' }).click();
  expect(new URL((await request).url()).searchParams.get('UserNameCont')).toBe(
    'ana',
  );
  await page.getByLabel('Nombre de usuario', { exact: true }).fill('missing');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'No encontramos usuarios' }),
  ).toBeVisible();
  await expect(
    page.getByLabel('Nombre de usuario', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Limpiar filtros' }).first().click();
  await expect(
    page.getByRole('button', { name: 'Opciones de ana', exact: true }),
  ).toBeVisible();
});
test('editing roles sends role names as strings', async ({ page }) => {
  await mockUsers(page);
  await page.route('**/api/user/ana', (route) =>
    route.request().method() === 'PUT'
      ? route.fulfill({ status: 204 })
      : route.fulfill({ json: { ...users[0], roles: ['userNormal'] } }),
  );
  await login(page);
  await page.goto('/session/user-home/edit/ana');
  await expect(
    page.getByRole('heading', { name: 'Roles', exact: true }),
  ).toBeVisible();
  const saved = page.waitForRequest(
    (r) => r.method() === 'PUT' && r.url().endsWith('/user/ana'),
  );
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await page.getByRole('button', { name: 'Actualizar', exact: true }).click();
  expect((await saved).postDataJSON()).toEqual({
    status: true,
    roles: ['userNormal'],
  });
});
test('mobile navigation opens with a button and Escape closes it', async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await login(page);
  await page.getByRole('button', { name: 'Abrir menú', exact: true }).tap();
  await expect(
    page.getByRole('button', { name: 'Contraer menú' }),
  ).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Abrir menú', exact: true }),
  ).toHaveAttribute('aria-expanded', 'false');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await context.close();
});

test('login and dashboard meet automated WCAG AA checks', async ({ page }) => {
  await page.goto('/login');
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await login(page);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});
test('desktop and phone previews render without overflow', async ({ page }) => {
  for (const width of [375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/login');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width === 1440 || width === 375)
      await page.screenshot({
        path: path.resolve('../previews/login-' + width + '.png'),
        fullPage: true,
      });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login(page);
  await page.screenshot({
    path: path.resolve('../previews/dashboard-1440.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({
    path: path.resolve('../previews/dashboard-375.png'),
    fullPage: true,
  });
  await mockUsers(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/session/user-home');
  await expect(
    page.getByRole('button', { name: 'Opciones de ana', exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: path.resolve('../previews/users-1440.png'),
    fullPage: true,
  });
});
