import { ListMakerListComponent } from '@utils/components/list-maker-list/list-maker-list.component';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserDto } from '@user/interface/user.interface';
import { RolService } from '@user/services/rol.service';
import { UserAdminService } from '@user/services/user-admin.service';
import { catalogueInterface } from '@utils/commons.interface';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-user-edit',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ListMakerListComponent,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    RouterLink,
  ],
  templateUrl: './user-edit.component.html',
  styleUrl: './user-edit.component.scss',
})
export class UserEditComponent implements OnInit {
  userName = '';
  userEdit?: UserDto;
  form!: FormGroup;
  rolOpt: catalogueInterface[] = [];
  saving = false;
  loadError = false;
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userSvc: UserAdminService,
    private route: ActivatedRoute,
    private roles: RolService,
  ) {}
  ngOnInit(): void {
    this.form = this.fb.group({
      roles: [[], Validators.required],
      status: [true, Validators.required],
    });
    this.userName = this.route.snapshot.params['userName'];
    this.userSvc.getUserByUserName(this.userName).subscribe({
      next: (user) => {
        this.userEdit = user;
        this.form.patchValue({
          roles: (user.roles ?? []).map((name) => ({
            id: name,
            name,
            description: '',
          })),
          status: user.isActive,
        });
      },
      error: () => (this.loadError = true),
    });
  }

  foundRoles(query: string): void {
    this.roles.get({ all: true }).subscribe({
      next: (roles) => {
        this.rolOpt = roles.items
          .filter((role) =>
            role.name.toLowerCase().includes(query.toLowerCase()),
          )
          .map((role) => ({ id: role.name, name: role.name, description: '' }));
      },
      error: () => {
        this.rolOpt = [];
      },
    });
  }
  clean(): void {
    this.form.patchValue({ roles: [] });
  }
  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.saving) return;
    this.saving = true;
    const confirmation = await Swal.fire({
      title: '¿Estás seguro de actualizar el usuario?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Actualizar',
      cancelButtonText: 'Cancelar',
    });
    if (!confirmation.isConfirmed) {
      this.saving = false;
      return;
    }
    const data = this.form.getRawValue();
    data.roles = data.roles.map((role: string | catalogueInterface) =>
      typeof role === 'string' ? role : role.id,
    );
    this.userSvc
      .updateUser(data, this.userName)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: async () => {
          await Swal.fire('El usuario ha sido actualizado', '', 'success');
          void this.router.navigate(['/session/user-home']);
        },
        error: () => {},
      });
  }
}
