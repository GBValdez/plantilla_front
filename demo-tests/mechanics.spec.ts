import { test, expect, Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/login');
  await page
    .getByLabel('Correo electrónico', { exact: true })
    .fill('admin@demo.local');
  await page.getByLabel('Contraseña', { exact: true }).fill('Demo2026!');
  await page.getByRole('button', { name: 'Entrar a mi espacio' }).click();
  await expect(page).toHaveURL(/dashboard/);
}

test('el menú conserva hover, transición y jerarquía, sin barra superior añadida', async ({
  page,
}) => {
  await login(page);
  const nav = page.getByRole('navigation', { name: 'Navegación principal' });
  await page.mouse.move(900, 600);
  await expect(nav).toHaveCSS('width', '60px');
  await nav.hover();
  await expect(nav).toHaveCSS('width', '300px');
  await expect(nav).toHaveCSS('transition-duration', '0.2s');
  await expect(
    nav.getByText('admin@demo.local', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('.workspace-header')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Administrador', exact: true })
    .click();
  await expect(
    nav.getByRole('link', { name: 'Usuarios', exact: true }),
  ).toBeVisible();
  await page.mouse.move(900, 600);
  await expect(nav).toHaveCSS('width', '60px');
  await expect(
    nav.getByRole('link', { name: 'Usuarios', exact: true }),
  ).toBeHidden();
  await nav.hover();
  await expect(
    nav.getByRole('link', { name: 'Usuarios', exact: true }),
  ).toBeVisible();
  await nav.getByRole('link', { name: 'Usuarios', exact: true }).focus();
  await page.keyboard.press('Escape');
  await expect(nav).toBeFocused();
  await expect(nav).toHaveCSS('width', '60px');
});

test('las tarjetas de usuarios abren su menú antes de editar', async ({
  page,
}) => {
  await login(page);
  await page.goto('/session/user-home');
  await page
    .getByRole('button', { name: 'Opciones de ana', exact: true })
    .click();
  await page.getByRole('menuitem', { name: 'Editar', exact: true }).click();
  await expect(page).toHaveURL(/user-home\/edit\/ana$/);
});

test('los roles conservan búsqueda, etiquetas, limpiar y confirmación cancelable', async ({
  page,
}) => {
  await login(page);
  await page.goto('/session/user-home/edit/ana');
  const roles = page.locator('app-list-maker-list');
  await expect(
    roles.getByRole('button', { name: 'Quitar userNormal' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Limpiar', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Guardar cambios' }),
  ).toBeDisabled();
  await page.getByRole('combobox', { name: 'Buscar Rol' }).fill('ADMIN');
  await page
    .getByRole('option', { name: 'ADMINISTRATOR', exact: true })
    .click();
  await expect(
    roles.getByRole('button', { name: 'Quitar ADMINISTRATOR' }),
  ).toBeVisible();
  let updates = 0;
  page.on('request', (request) => {
    if (request.method() === 'PUT' && request.url().endsWith('/user/ana'))
      updates++;
  });
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(
    page.getByRole('dialog', {
      name: '¿Estás seguro de actualizar el usuario?',
    }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Cancelar', exact: true })
    .last()
    .click();
  await expect(page).toHaveURL(/edit\/ana$/);
  expect(updates).toBe(0);
  await roles.getByRole('button', { name: 'Quitar ADMINISTRATOR' }).click();
  await expect(
    page.getByRole('button', { name: 'Guardar cambios' }),
  ).toBeDisabled();
});

test('cerrar sesión conserva la confirmación y permite cancelar', async ({
  page,
}) => {
  await login(page);
  await page.getByRole('navigation').hover();
  await page
    .getByRole('button', { name: 'Cerrar sesión', exact: true })
    .click();
  await expect(
    page.getByRole('dialog', { name: '¿Estás seguro de cerrar sesión?' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page).toHaveURL(/dashboard/);
  await page.getByRole('navigation').hover();
  await page
    .getByRole('button', { name: 'Cerrar sesión', exact: true })
    .click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Cerrar sesión', exact: true })
    .click();
  await expect(page).toHaveURL(/login/);
});
