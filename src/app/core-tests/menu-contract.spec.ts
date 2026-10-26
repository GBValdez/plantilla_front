import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SubLevelComponent } from '@utils/side-menu/components/sub-level/sub-level.component';
import { sideMenuInterfaceInternal } from '@utils/side-menu/side-menu.interface';
import { beforeEach, expect, it, vi } from 'vitest';

const router = { url: '/', navigate: vi.fn() };
let menu: SubLevelComponent;
beforeEach(() => {
  router.navigate.mockClear();
  TestBed.configureTestingModule({
    providers: [{ provide: Router, useValue: router }],
  });
  menu = TestBed.runInInjectionContext(() => new SubLevelComponent());
});

it('una entrada con ruta e hijos conserva navegación y apertura', () => {
  const entry: sideMenuInterfaceInternal = {
    text: 'Sección',
    icon: 'folder',
    click: '/session/seccion',
    child: [],
  };
  menu.action(entry);
  expect(router.navigate).toHaveBeenCalledWith(['/session/seccion']);
  expect(entry.openChild).toBe(true);
});

it('abrir un grupo cierra el grupo anterior del mismo nivel', () => {
  const first: sideMenuInterfaceInternal = {
    text: 'Primero',
    icon: 'folder',
    child: [],
  };
  const second: sideMenuInterfaceInternal = {
    text: 'Segundo',
    icon: 'folder',
    child: [],
  };
  menu.action(first);
  menu.action(second);
  expect(first.openChild).toBe(false);
  expect(second.openChild).toBe(true);
  menu.action(second);
  expect(second.openChild).toBe(false);
});
