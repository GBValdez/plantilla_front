import {
  ChangeDetectionStrategy,
  Component,
  SimpleChange,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { BtnUploadFileDirective } from '@utils/btn-upload-file/btn-upload-file.directive';
import { BtnUploadFileModule } from '@utils/btn-upload-file/btn-upload-file.module';
import { InputAutocompleteComponent } from '@utils/components/input-autocomplete/input-autocomplete.component';
import { ListMakerListComponent } from '@utils/components/list-maker-list/list-maker-list.component';
import { TimeRangeComponent } from '@utils/components/time-range/time-range.component';
import { catalogueInterface } from '@utils/commons.interface';
import { OnlyNumberInputDirective } from '@utils/directivas/only-number-input.directive';
import { OnlyNumberLetterInputDirective } from '@utils/directivas/only-number-letter-input.directive';
import { LocalTimezonePipe } from '@utils/pipes/local-timezone-pipe.pipe';
import { afterEach, expect, it, vi } from 'vitest';
import Swal from 'sweetalert2';

afterEach(() => {
  TestBed.resetTestingModule();
  vi.restoreAllMocks();
});

@Component({
  imports: [
    BtnUploadFileModule,
    ReactiveFormsModule,
    OnlyNumberInputDirective,
    OnlyNumberLetterInputDirective,
  ],
  template: `<button
      dtBtnUploadFile
      typesPermitted=".png"
      [maxSize]="4"
      (fileChange)="file = $event"
    >
      Archivo
    </button>
    <input [formControl]="numeric" appOnlyNumberInput /><input
      [formControl]="letters"
      appOnlyNumberLetterInput
    />`,
})
class ControlsHost {
  file?: FileList;
  numeric = new FormControl('');
  letters = new FormControl('');
}

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [InputAutocompleteComponent, ReactiveFormsModule],
  template: `<app-input-autocomplete
    [formControl]="choice"
    [options]="options"
    [noFilter]="true"
    >Opción</app-input-autocomplete
  >`,
})
class AutocompleteHost {
  choice = new FormControl(7);
  options: catalogueInterface[] = [];
}

it('el binding CVA conserva la selección asíncrona y respeta el texto que el usuario empieza a escribir', async () => {
  const fixture = TestBed.createComponent(AutocompleteHost);
  fixture.detectChanges();
  const input = fixture.nativeElement.querySelector(
    'input',
  ) as HTMLInputElement;
  fixture.componentInstance.options = [
    { id: 7, name: 'Siete', description: '' },
  ];
  fixture.detectChanges();
  await fixture.whenStable();
  expect(input.value).toBe('Siete');
  expect(fixture.componentInstance.choice.value).toBe(7);
  fixture.componentInstance.choice.setValue(8);
  fixture.detectChanges();
  await fixture.whenStable();
  input.value = 'Texto nuevo';
  input.dispatchEvent(new Event('input'));
  fixture.componentInstance.options = [
    ...fixture.componentInstance.options,
    { id: 8, name: 'Ocho', description: '' },
  ];
  fixture.detectChanges();
  await fixture.whenStable();
  expect(input.value).toBe('Texto nuevo');
});

it('el NgModule original de archivos conserva tipo permitido, tamaño, etiqueta y evento', () => {
  const fixture = TestBed.createComponent(ControlsHost);
  fixture.detectChanges();
  const button = fixture.debugElement.query(
    By.directive(BtnUploadFileDirective),
  );
  const control = button.injector.get(BtnUploadFileDirective);
  const files = (name: string, type: string, content: string) =>
    ({
      length: 1,
      item: () => new File([content], name, { type }),
    }) as unknown as FileList;
  const valid = files('imagen.png', 'image/png', 'ok');
  control.uploadFile(valid);
  expect(fixture.componentInstance.file).toBe(valid);
  expect(button.nativeElement.textContent).toBe('imagen.png');
  control.uploadFile(files('documento.pdf', 'application/pdf', 'ok'));
  expect(fixture.componentInstance.file).toBeUndefined();
  expect(button.nativeElement.textContent.trim()).toBe('Archivo');
  control.uploadFile(files('grande.png', 'image/png', '12345'));
  expect(fixture.componentInstance.file).toBeUndefined();
});

it('las directivas conservan los filtros numérico y alfanumérico', () => {
  const fixture = TestBed.createComponent(ControlsHost);
  fixture.detectChanges();
  const inputs = fixture.nativeElement.querySelectorAll(
    'input',
  ) as NodeListOf<HTMLInputElement>;
  inputs[0].value = '12a.3';
  inputs[0].dispatchEvent(new Event('input'));
  inputs[1].value = 'AB-12 á';
  inputs[1].dispatchEvent(new Event('input'));
  expect(fixture.componentInstance.numeric.value).toBe('123');
  expect(fixture.componentInstance.letters.value).toBe('AB12');
});

it('el autocompletado conserva los identificadores numéricos recibidos como texto', () => {
  const control = new InputAutocompleteComponent(new FormBuilder(), null!);
  const option = { id: 7, name: 'Opción', description: '' };
  control.options = [option];
  control.writeValue('7');
  expect(control.form.value).toEqual(option);
});

it('el autocompletado conserva el valor inicial cuando las opciones llegan después', async () => {
  const control = new InputAutocompleteComponent(new FormBuilder(), null!);
  const option = { id: 7, name: 'Opción', description: '' };
  control.writeValue(7);
  await Promise.resolve();
  control.options = [option];
  control.ngOnChanges({ options: new SimpleChange([], [option], false) });
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(control.form.value).toEqual(option);
});

it('la lista conserva selección, rechazo de duplicados, eliminación e ids emitidos', () => {
  vi.spyOn(Swal, 'fire').mockResolvedValue({
    isConfirmed: false,
    isDenied: false,
    isDismissed: true,
  });
  const control = new ListMakerListComponent(null!);
  const first = { id: 1, name: 'Uno', description: '' };
  const second = { id: 2, name: 'Dos', description: '' };
  const changed = vi.fn();
  control.registerOnChange(changed);
  control.writeValue([first]);
  expect(changed).not.toHaveBeenCalled();
  control.addItems(second);
  expect(changed).toHaveBeenLastCalledWith([1, 2]);
  control.addItems(second);
  expect(control.itemsSelected).toHaveLength(2);
  expect(Swal.fire).toHaveBeenCalledWith(
    'Error',
    'El item ya esta en la lista',
    'error',
  );
  control.removeItem(first);
  expect(changed).toHaveBeenLastCalledWith([2]);
  control.writeValue([]);
  expect(control.itemsSelected).toEqual([]);
});

it('el rango horario conserva valores, validación, emisión y estado deshabilitado', () => {
  const control = new TimeRangeComponent(null!, new FormBuilder());
  control.writeValue({ init: '09:00', end: '10:00' });
  control.ngOnInit();
  const changed = vi.fn();
  control.registerOnChange(changed);
  control.form.patchValue({ end: '08:00' });
  expect(control.form.hasError('rangeInvalid')).toBe(true);
  expect(changed).toHaveBeenLastCalledWith(null);
  control.form.patchValue({ end: '11:00' });
  expect(changed).toHaveBeenLastCalledWith({ init: '09:00', end: '11:00' });
  control.setDisabledState?.(true);
  expect(control.form.disabled).toBe(true);
});

it('el formato de zona horaria conserva conversión local y formato solicitado', () => {
  const pipe = new LocalTimezonePipe();
  const input = '2026-10-26T12:00:00Z';
  const expected = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(new Date(input));
  expect(pipe.transform(input, 'YYYY-MM-DD')).toBe(expected);
});
