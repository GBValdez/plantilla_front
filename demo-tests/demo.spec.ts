import { test, expect, Page } from '@playwright/test';

async function login(page: Page, email = 'admin@demo.local') {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill('Demo2026!');
  await page.getByRole('button', { name: 'Entrar a mi espacio' }).click();
  await expect(page).toHaveURL(/dashboard/);
}

test('demo login, real local proxy, filters and pagination work without mocks', async ({
  page,
}) => {
  await login(page);
  await expect(page.getByLabel('Modo de demostración')).toBeVisible();
  const health = await page.request.get('/api/health');
  expect((await health.json()).demo).toBe(true);
  await page.getByRole('navigation').hover();
  await page
    .getByRole('button', { name: 'Administrador', exact: true })
    .click();
  await page.getByRole('link', { name: 'Usuarios', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Opciones de ana', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Página siguiente' }).click();
  await expect(page.getByText('11–20 de 26')).toBeVisible();
  await page.getByLabel('Nombre de usuario', { exact: true }).fill('ana');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Opciones de ana', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('1 resultados')).toBeVisible();
});

test('demo user edits persist after reloading the page', async ({ page }) => {
  await login(page);
  await page.goto('/session/user-home/edit/ana');
  await expect(
    page.getByRole('heading', { name: 'Roles', exact: true }),
  ).toBeVisible();
  await page.getByRole('combobox', { name: 'Estado de la cuenta' }).click();
  await page.getByRole('option', { name: 'Inactivo', exact: true }).click();
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await page.getByRole('button', { name: 'Actualizar', exact: true }).click();
  await page.getByRole('button', { name: 'OK', exact: true }).click();
  await expect(page).toHaveURL(/user-home$/);
  await page.goto('/session/user-home/edit/ana');
  await expect(
    page.getByRole('combobox', { name: 'Estado de la cuenta' }),
  ).toHaveText('Inactivo');
});

test('demo session is separate from normal sessions and member permissions are respected', async ({
  page,
}) => {
  await page.goto('/login');
  await page.evaluate(() =>
    localStorage.setItem('plantilla:auth', 'production-marker'),
  );
  await login(page, 'usuario@demo.local');
  expect(
    await page.evaluate(() => localStorage.getItem('plantilla:auth')),
  ).toBe('production-marker');
  expect(
    await page.evaluate(() => localStorage.getItem('plantilla-demo:auth')),
  ).not.toBeNull();
  await expect(
    page.getByRole('link', { name: 'Usuarios', exact: true }),
  ).toHaveCount(0);
  await page.goto('/session/user-home');
  await expect(page).toHaveURL(/dashboard/);
});
