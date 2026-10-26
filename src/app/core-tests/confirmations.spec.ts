import { FormBuilder } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UserCreateComponent } from '@user/pages/user-create/user-create.component';
import { ResetPasswordComponent } from '@user/pages/reset-password/reset-password.component';
import { UserService } from '@user/services/user.service';
import moment from 'moment';
import { of } from 'rxjs';
import Swal from 'sweetalert2';
import { afterEach, expect, it, vi } from 'vitest';

afterEach(() => vi.restoreAllMocks());

it('cancelar la confirmación de registro conserva el formulario y no crea la cuenta', async () => {
  vi.spyOn(Swal, 'fire').mockResolvedValue({
    isConfirmed: false,
    isDenied: false,
    isDismissed: true,
  });
  const service = { createUser: vi.fn(() => of({})) };
  const dialog = { close: vi.fn() };
  const component = new UserCreateComponent(
    new FormBuilder(),
    service as unknown as UserService,
    dialog as unknown as MatDialogRef<UserCreateComponent>,
  );
  component.ngOnInit();
  component.form.setValue({
    name: 'Ana',
    birthdate: moment('1990-01-01'),
    tel: '12345678',
    address: 'Ciudad',
    email: 'ana@example.com',
    password: 'Example!123',
    userName: 'ana',
  });
  await component.createUser();
  expect(Swal.fire).toHaveBeenCalledWith(
    expect.objectContaining({
      showCancelButton: true,
      confirmButtonText: 'Guardar',
    }),
  );
  expect(service.createUser).not.toHaveBeenCalled();
  expect(dialog.close).not.toHaveBeenCalled();
  expect(component.form.value.userName).toBe('ana');
  expect(component.submitting).toBe(false);
});

it('cancelar la confirmación de contraseña no envía el cambio', async () => {
  vi.spyOn(Swal, 'fire').mockResolvedValue({
    isConfirmed: false,
    isDenied: false,
    isDismissed: true,
  });
  const service = { resetPassword: vi.fn(() => of({})) };
  const router = { navigate: vi.fn() };
  const route = {
    snapshot: { params: { gmail: 'ana@example.com', token: 'token' } },
  };
  const component = new ResetPasswordComponent(
    new FormBuilder(),
    router as unknown as Router,
    route as unknown as ActivatedRoute,
    service as unknown as UserService,
  );
  component.ngOnInit();
  component.form.setValue({
    password: 'Example!123',
    confirmPassword: 'Example!123',
  });
  await component.resetPassword();
  expect(Swal.fire).toHaveBeenCalledWith(
    expect.objectContaining({
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'No',
    }),
  );
  expect(service.resetPassword).not.toHaveBeenCalled();
  expect(router.navigate).not.toHaveBeenCalled();
  expect(component.submitting).toBe(false);
});
