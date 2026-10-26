import { finalize } from 'rxjs';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { UserService } from '@user/services/user.service';
import Swal from 'sweetalert2';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    RouterModule,
    MatIconModule,
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  passwordEqual: ValidatorFn = (control) => {
    const password = control.get('password')!.value;
    const confirmPassword = control.get('confirmPassword')!.value;
    if (password === confirmPassword) return null;
    else return { noIgual: true };
  };
  symbols: string = '@$!%*?&#';
  form!: FormGroup;
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private activateRoute: ActivatedRoute,
    private userSvc: UserService,
  ) {}
  gmail: string = '';
  token: string = '';

  ngOnInit(): void {
    this.form = this.fb.group(
      {
        password: [
          '',
          [
            Validators.pattern(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
            ),
            Validators.required,
          ],
        ],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordEqual.bind(this) },
    );
    this.gmail = this.activateRoute.snapshot.params['gmail'];
    this.token = this.activateRoute.snapshot.params['token'];
  }
  submitting = false;
  async resetPassword(): Promise<void> {
    if (this.submitting) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    const confirmation = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas cambiar tu contraseña?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí',
      cancelButtonText: 'No',
    });
    if (!confirmation.isConfirmed) {
      this.submitting = false;
      return;
    }
    this.userSvc
      .resetPassword(this.token, this.gmail, this.form.value.password)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          void Swal.fire({ title: 'Contraseña actualizada', icon: 'success' });
          void this.router.navigate(['/login']);
        },
        error: () => {},
      });
  }
}
