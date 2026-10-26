import { ChangeDetectionStrategy } from '@angular/core';
import { Component, ElementRef, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ForgotPasswordComponent } from '@user/pages/forgot-password/forgot-password.component';
import { MatIconModule } from '@angular/material/icon';
import { LoginService } from '@auth/services/login.service';
import { AuthService } from '@auth/services/auth.service';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { UserCreateComponent } from '@user/pages/user-create/user-create.component';
import { finalize } from 'rxjs';
import { environment } from '@env/environment';
import { BtnUploadFileDirective } from '@utils/btn-upload-file/btn-upload-file.directive';

interface LoginClaims {
  email: string;
  clientId?: string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?:
    string | string[];
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'?: string;
}
@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-home',
  standalone: true,
  imports: [
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatIconModule,
    BtnUploadFileDirective,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  readonly demo = environment.demo;
  form!: FormGroup;
  submitting = false;
  errorMessage = '';
  constructor(
    private loginSvc: LoginService,
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private dialog: MatDialog,
    private element: ElementRef<HTMLElement>,
  ) {}
  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }
  login(): void {
    if (this.submitting) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.element.nativeElement
        .querySelector<HTMLInputElement>('input.ng-invalid')
        ?.focus();
      return;
    }
    this.submitting = true;
    this.errorMessage = '';
    this.loginSvc
      .login({ ...this.form.value, email: this.form.value.email.trim() })
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: (res) => {
          try {
            const claims = jwtDecode<LoginClaims>(res.token);
            const role =
              claims[
                'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'
              ];
            this.auth.setAuth({
              token: res.token,
              expiration: res.expiration,
              email: claims.email,
              roles: Array.isArray(role) ? role : role ? [role] : [],
              userName:
                claims[
                  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'
                ] ?? claims.email,
              clientId: claims.clientId ? Number(claims.clientId) : undefined,
            });
            if (!this.auth.hasAuth()) throw new Error('invalid session');
            this.form.reset();
            void this.router.navigate(['/session/dashboard']);
          } catch {
            this.errorMessage =
              'La sesión recibida no es válida. Vuelve a intentarlo.';
          }
        },
        error: () => {
          this.errorMessage =
            'No se pudo iniciar sesión. Revisa tus datos e inténtalo de nuevo.';
        },
      });
  }
  createAccount(): void {
    this.dialog.open(UserCreateComponent, {
      width: '580px',
      maxWidth: '94vw',
      maxHeight: '92vh',
    });
  }
  forgotPassword(): void {
    this.dialog.open(ForgotPasswordComponent, {
      width: '460px',
      maxWidth: '94vw',
    });
  }
}
