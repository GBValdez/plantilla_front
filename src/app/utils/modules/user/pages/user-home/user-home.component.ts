import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { spanishPaginator } from '@utils/paginator-intl';
import { ChangeDetectionStrategy } from '@angular/core';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { UserDto } from '@user/interface/user.interface';
import { RolService } from '@user/services/rol.service';
import { UserAdminService } from '@user/services/user-admin.service';
import { catalogueInterface } from '@utils/commons.interface';
import { Subscription, finalize } from 'rxjs';
@Component({
  providers: [{ provide: MatPaginatorIntl, useFactory: spanishPaginator }],
  changeDetection: ChangeDetectionStrategy.Eager,
  selector: 'app-user-home',
  standalone: true,
  imports: [
    MatMenuModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatPaginatorModule,
    RouterLink,
    MatSelectModule,
  ],
  templateUrl: './user-home.component.html',
  styleUrl: './user-home.component.scss',
})
export class UserHomeComponent implements OnInit {
  private readonly destroy = inject(DestroyRef);
  private request?: Subscription;
  form!: FormGroup;
  rolesOpt: catalogueInterface[] = [];
  users: UserDto[] = [];
  sizeUsers = 0;
  indexPage = 0;
  pageSize = 10;
  loading = false;
  loadError = false;
  constructor(
    private userAdminSvc: UserAdminService,
    private fb: FormBuilder,
    private rolSvc: RolService,
  ) {}
  ngOnInit(): void {
    this.form = this.fb.group({
      UserNameCont: [''],
      EmailCont: [''],
      roles: [[]],
      isActive: [null],
    });
    this.getUser();
    this.rolSvc
      .get({ all: true })
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe({ next: (r) => (this.rolesOpt = r.items), error: () => {} });
  }
  getUser(): void {
    this.request?.unsubscribe();
    this.loading = true;
    this.loadError = false;
    this.request = this.userAdminSvc
      .getUsers(this.pageSize, this.indexPage + 1, this.form.getRawValue())
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => (this.loading = false)),
      )
      .subscribe({
        next: (r) => {
          this.users = r.items;
          this.sizeUsers = r.total;
        },
        error: () => {
          this.loadError = true;
          this.users = [];
          this.sizeUsers = 0;
        },
      });
  }
  changePagination(event: PageEvent): void {
    this.indexPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.getUser();
  }
  search(): void {
    this.indexPage = 0;
    this.getUser();
  }
  cleanFilter(): void {
    this.form.reset({
      UserNameCont: '',
      EmailCont: '',
      roles: [],
      isActive: null,
    });
    this.search();
  }
}
