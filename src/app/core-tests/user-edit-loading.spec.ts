import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { UserEditComponent } from '@user/pages/user-edit/user-edit.component';
import { RolService } from '@user/services/rol.service';
import { UserAdminService } from '@user/services/user-admin.service';
import { of, throwError } from 'rxjs';
import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => TestBed.resetTestingModule());

it('un fallo al buscar roles no impide cargar ni editar los datos existentes del usuario', () => {
  const user = {
    userName: 'ana',
    email: 'ana@example.com',
    isActive: true,
    roles: ['userNormal'],
  };
  const roles = {
    get: vi.fn(() => throwError(() => new Error('Roles no disponibles'))),
  };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { params: { userName: 'ana' } } },
      },
      {
        provide: UserAdminService,
        useValue: { getUserByUserName: () => of(user) },
      },
      { provide: RolService, useValue: roles },
    ],
  });
  const fixture = TestBed.createComponent(UserEditComponent);
  fixture.detectChanges();
  expect(fixture.componentInstance.userEdit).toEqual(user);
  expect(roles.get).not.toHaveBeenCalled();
  fixture.componentInstance.foundRoles('ADMIN');
  fixture.detectChanges();
  expect(roles.get).toHaveBeenCalledWith({ all: true });
  expect(fixture.componentInstance.loadError).toBe(false);
  expect(fixture.componentInstance.form.value.roles).toEqual([
    { id: 'userNormal', name: 'userNormal', description: '' },
  ]);
  fixture.componentInstance.form.patchValue({ status: false });
  fixture.detectChanges();
  expect(fixture.componentInstance.form.valid).toBe(true);
  expect(
    (
      fixture.nativeElement.querySelector(
        'button[type="submit"]',
      ) as HTMLButtonElement
    ).disabled,
  ).toBe(false);
});
