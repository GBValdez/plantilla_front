import { TestBed } from '@angular/core/testing';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { appConfig } from '../app.config';
import { UserCreateComponent } from '@user/pages/user-create/user-create.component';
import { ForgotPasswordComponent } from '@user/pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from '@user/pages/reset-password/reset-password.component';
import { UserService } from '@user/services/user.service';
import moment from 'moment';
import { afterEach, expect, it } from 'vitest';

afterEach(() => TestBed.resetTestingModule());

it('conserva el adaptador y formato de fecha compartidos para los formularios reutilizables', () => {
  TestBed.configureTestingModule({ providers: appConfig.providers });
  const adapter = TestBed.inject(DateAdapter, null);
  const formats = TestBed.inject(MAT_DATE_FORMATS, null);
  expect(adapter).not.toBeNull();
  expect(formats?.parse.dateInput).toBe('DD/MM/YYYY');
  expect(
    adapter?.format(adapter.createDate(2000, 2, 4), formats!.display.dateInput),
  ).toBe('04/03/2000');
  expect(moment.isMoment(adapter?.createDate(2000, 2, 4))).toBe(true);
});

it.each([
  ['registro', UserCreateComponent],
  ['recuperación', ForgotPasswordComponent],
  ['cambio de contraseña', ResetPasswordComponent],
] as const)(
  'el botón de %s conserva su bloqueo mientras el formulario es inválido',
  (_name, component) => {
    TestBed.configureTestingModule({
      imports: [component],
      providers: [
        provideRouter([]),
        { provide: UserService, useValue: {} },
        { provide: MatDialogRef, useValue: {} },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {} } } },
      ],
    });
    const fixture = TestBed.createComponent(
      component as typeof UserCreateComponent,
    );
    fixture.detectChanges();
    const submit = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    expect(fixture.componentInstance.form.invalid).toBe(true);
    expect(submit.disabled).toBe(true);
  },
);
