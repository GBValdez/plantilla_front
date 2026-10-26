import { TestBed } from '@angular/core/testing';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { CatalogueFormComponent } from '@catalogues/catalogue-form/catalogue-form.component';
import { CataloguesHomeComponent } from '@catalogues/catalogues-home/catalogues-home.component';
import { CatalogueService } from '@catalogues/services/catalogue.service';
import { FormCmsComponent } from '@utils/components/form-cms/form-cms.component';
import { HomeCmsComponent } from '@utils/components/home-cms/home-cms.component';
import { formModalDto, homeSvc } from '@utils/commons.interface';
import { of, Subject } from 'rxjs';
import Swal from 'sweetalert2';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const item = { id: 7, name: 'Registro', description: 'Descripción' };
const page = { items: [item], total: 24, index: 1, totalPages: 3 };
const cancelled = { isConfirmed: false, isDenied: false, isDismissed: true };
const confirmed = { isConfirmed: true, isDenied: false, isDismissed: false };
beforeEach(() => vi.spyOn(Swal, 'fire').mockResolvedValue(cancelled));
afterEach(() => {
  TestBed.resetTestingModule();
  vi.restoreAllMocks();
});

function cmsForm(data?: object) {
  const form = new FormGroup({
    name: new FormControl(''),
    parentId: new FormControl<number | null>(null),
  });
  const options: formModalDto = {
    title: 'Registro',
    form,
    data,
    dialogRef: { close: vi.fn() } as unknown as MatDialogRef<unknown>,
    post: vi.fn(() => of({})),
    put: vi.fn(() => of({})),
    map: (value) => ({ ...value, name: value.name.trim() }),
    mapEdit: (value) => ({ ...value, name: value.name.toUpperCase() }),
    finalizeEdit: vi.fn(),
  };
  const fixture = TestBed.createComponent(FormCmsComponent);
  fixture.componentRef.setInput('data', options);
  fixture.detectChanges();
  return { fixture, options, component: fixture.componentInstance, form };
}

it('CMS conserva carga para edición, mapeos y confirmación cancelable', async () => {
  const { component, form, options } = cmsForm({
    id: 7,
    name: 'Registro',
    parent: { id: 3 },
  });
  expect(form.value).toEqual({ name: 'REGISTRO', parentId: 3 });
  expect(options.finalizeEdit).toHaveBeenCalledOnce();
  await component.onSubmit();
  expect(Swal.fire).toHaveBeenCalledWith(
    expect.objectContaining({ showCancelButton: true }),
  );
  expect(options.put).not.toHaveBeenCalled();
  expect(options.post).not.toHaveBeenCalled();
});

it.each([false, true])(
  'CMS conserva creación/edición (%s), confirmación y cierre con modify',
  async (editing) => {
    vi.mocked(Swal.fire).mockResolvedValue(confirmed);
    const { component, form, options } = cmsForm(
      editing ? { id: 7, name: 'Registro', parentId: 3 } : undefined,
    );
    form.patchValue({ name: ' Nuevo ', parentId: 3 });
    await component.onSubmit();
    if (editing)
      expect(options.put).toHaveBeenCalledWith(7, {
        name: 'Nuevo',
        parentId: 3,
      });
    else
      expect(options.post).toHaveBeenCalledWith({ name: 'Nuevo', parentId: 3 });
    await vi.waitFor(() =>
      expect(options.dialogRef.close).toHaveBeenCalledWith({ modify: true }),
    );
  },
);

it('Limpiar del CMS conserva todos los controles vacíos y marcados como tocados', () => {
  const { fixture, form } = cmsForm({ id: 7, name: 'Registro', parentId: 3 });
  const button = [
    ...(fixture.nativeElement.querySelectorAll(
      'button',
    ) as NodeListOf<HTMLButtonElement>),
  ].find((button) => button.textContent?.trim() === 'Limpiar')!;
  button.click();
  expect(form.value).toEqual({ name: null, parentId: null });
  expect(Object.values(form.controls).every((control) => control.touched)).toBe(
    true,
  );
});

it('CMS conserva tarjetas con menú, paginación y actualización sólo si el diálogo modifica', async () => {
  const closed = new Subject<{ modify: boolean }>();
  const dialog = { open: vi.fn(() => ({ afterClosed: () => closed })) };
  const route = { navigate: vi.fn() };
  TestBed.configureTestingModule({
    providers: [
      { provide: MatDialog, useValue: dialog },
      { provide: Router, useValue: route },
      { provide: ActivatedRoute, useValue: {} },
    ],
  });
  const service: homeSvc = {
    title: 'Registros',
    formComponent: FormCmsComponent,
    query: { active: true },
    get: vi.fn(() => of(page)),
    delete: vi.fn(() => of({})),
  };
  const fixture = TestBed.createComponent(HomeCmsComponent);
  fixture.componentRef.setInput('homeSvc', service);
  fixture.detectChanges();
  (fixture.nativeElement.querySelector('mat-card') as HTMLElement).click();
  fixture.detectChanges();
  await fixture.whenStable();
  const edit = [...document.querySelectorAll('button[mat-menu-item]')].find(
    (button) => button.textContent?.includes('Editar'),
  ) as HTMLButtonElement;
  expect(edit).toBeTruthy();
  edit.click();
  expect(dialog.open).toHaveBeenCalledWith(
    FormCmsComponent,
    expect.objectContaining({ data: expect.objectContaining({ data: item }) }),
  );
  closed.next({ modify: false });
  expect(service.get).toHaveBeenCalledTimes(1);
  closed.next({ modify: true });
  expect(service.get).toHaveBeenCalledTimes(2);
  fixture.componentInstance.changePagination({
    pageIndex: 1,
    pageSize: 5,
    length: 24,
  });
  expect(service.get).toHaveBeenLastCalledWith({
    pageNumber: 2,
    pageSize: 5,
    query: { active: true },
  });
  fixture.componentInstance.clickBtn('/detalle', 7);
  expect(route.navigate).toHaveBeenCalledWith(['/detalle', 7]);
  const action = vi.fn();
  fixture.componentInstance.clickBtn(action, 7);
  expect(action).toHaveBeenCalledWith(7);
  await fixture.componentInstance.deleteItem(item);
  expect(service.delete).not.toHaveBeenCalled();
});

function catalogueForm(custom = false) {
  const afterComplete = custom ? vi.fn() : undefined;
  const service = {
    get: vi.fn(() =>
      of({ ...page, items: [{ id: 3, name: 'Padre', description: '' }] }),
    ),
    create: vi.fn(() => of({})),
    update: vi.fn(() => of({})),
  };
  const close = vi.fn();
  TestBed.configureTestingModule({
    providers: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: {
          title: 'Registro',
          typeCatalogue: 'catalogo',
          catalogue: { ...item, catalogueParent: { id: 3 } },
          dependency: { id: 'padres', name: 'Padre' },
          afterComplete,
        },
      },
      { provide: CatalogueService, useValue: service },
      { provide: MatDialogRef, useValue: { close } },
    ],
  });
  const fixture = TestBed.createComponent(CatalogueFormComponent);
  fixture.detectChanges();
  return {
    fixture,
    component: fixture.componentInstance,
    service,
    close,
    afterComplete,
  };
}

it('catálogos conservan dependencia, valores editados y cancelación de guardar', async () => {
  const { component, service } = catalogueForm();
  expect(service.get).toHaveBeenCalledWith('padres', 1, 10, { all: true });
  expect(component.form.value).toEqual({
    name: 'Registro',
    description: 'Descripción',
    catalogueParentId: 3,
  });
  await component.onSubmit();
  expect(service.update).not.toHaveBeenCalled();
  component.cleanForm();
  expect(component.form.value).toEqual({
    name: '',
    description: '',
    catalogueParentId: null,
  });
  expect(component.form.invalid).toBe(true);
});

it('catálogos conservan afterComplete sin sustituirlo por un guardado automático', async () => {
  const { component, service, afterComplete } = catalogueForm(true);
  await component.onSubmit();
  expect(afterComplete).toHaveBeenCalledWith(
    expect.objectContaining({ id: 7, name: 'Registro', catalogueParentId: 3 }),
    expect.anything(),
    expect.anything(),
  );
  expect(service.update).not.toHaveBeenCalled();
  expect(Swal.fire).not.toHaveBeenCalled();
});

it('catálogos conservan edición confirmada y cierre con modify', async () => {
  vi.mocked(Swal.fire).mockResolvedValue(confirmed);
  const { component, service, close } = catalogueForm();
  component.form.patchValue({ name: 'Cambiado' });
  await component.onSubmit();
  expect(service.update).toHaveBeenCalledWith(7, 'catalogo', {
    name: 'Cambiado',
    description: 'Descripción',
    catalogueParentId: 3,
  });
  await vi.waitFor(() => expect(close).toHaveBeenCalledWith({ modify: true }));
});

it.each(['catalogo', 'rol'])(
  'las tarjetas de catálogo %s conservan sus acciones y restricciones originales',
  async (type) => {
    const service = { get: vi.fn(() => of(page)), delete: vi.fn(() => of({})) };
    TestBed.configureTestingModule({
      providers: [
        { provide: CatalogueService, useValue: service },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { data: { typeCatalogue: type, titleShow: 'Registros' } },
          },
        },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(CataloguesHomeComponent);
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelectorAll('mat-card')[1] as HTMLElement
    ).click();
    fixture.detectChanges();
    await fixture.whenStable();
    const actions = [
      ...document.querySelectorAll('button[mat-menu-item]'),
    ] as HTMLButtonElement[];
    if (type === 'rol') {
      expect(actions).toHaveLength(1);
      expect(actions[0].disabled).toBe(true);
    } else {
      expect(
        actions.some((action) => action.textContent?.includes('Editar')),
      ).toBe(true);
      const remove = actions.find((action) =>
        action.textContent?.includes('Borrar'),
      )!;
      remove.click();
      await fixture.whenStable();
      expect(service.delete).not.toHaveBeenCalled();
    }
    fixture.componentInstance.form.patchValue({ nameCont: 'Registro' });
    fixture.componentInstance.searchCatalogue();
    fixture.componentInstance.changePagination({
      pageIndex: 1,
      pageSize: 5,
      length: 24,
    });
    expect(service.get).toHaveBeenLastCalledWith(
      type,
      2,
      5,
      { nameCont: 'Registro' },
      false,
    );
  },
);
