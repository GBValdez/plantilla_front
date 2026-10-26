import { finalize } from 'rxjs';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { UserService } from '@user/services/user.service';
import Swal from 'sweetalert2';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent implements OnInit {
  constructor(
    private fb: FormBuilder,
    private userSvc: UserService,
    private dialogRef: MatDialogRef<ForgotPasswordComponent>,
  ) {}
  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }
  form!: FormGroup;
  submitting = false;
  forgotPassword(): void {
    if (this.submitting) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    this.userSvc
      .forgotPassword(this.form.value.email.trim())
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.dialogRef.close();
          void Swal.fire({
            title: 'Revisa tu correo',
            text: 'Si la cuenta está registrada y activa, recibirás un enlace para cambiar tu contraseña.',
            icon: 'success',
          });
        },
        error: () => {},
      });
  }
}
