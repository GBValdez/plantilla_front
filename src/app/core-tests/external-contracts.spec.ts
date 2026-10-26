import { TemplateRef, ViewContainerRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, NgControl, Validators } from '@angular/forms';
import { AutocompleteGoogleMapsComponent } from '@utils/components/autocomplete-google-maps/autocomplete-google-maps.component';
import { DrErrorInputsDirective } from '@utils/dr-error-inputs/dr-error-inputs.directive';
import { ExportService } from '@utils/export.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { read, utils } from 'xlsx';
import jsPDF from 'jspdf';

const downloads: { name: string; blob: Blob }[] = [];
const createDescriptor = Object.getOwnPropertyDescriptor(
  URL,
  'createObjectURL',
);
const revokeDescriptor = Object.getOwnPropertyDescriptor(
  URL,
  'revokeObjectURL',
);
beforeEach(() => {
  downloads.length = 0;
  const blobs = new Map<string, Blob>();
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: (blob: Blob) => {
      const url = 'blob:local/' + blobs.size;
      blobs.set(url, blob);
      return url;
    },
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: () => {},
  });
  const record = (anchor: HTMLAnchorElement) => {
    const blob = blobs.get(anchor.href);
    if (blob) downloads.push({ name: anchor.download, blob });
  };
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    record(this);
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'dispatchEvent').mockImplementation(
    function (this: HTMLAnchorElement) {
      record(this);
      return true;
    },
  );
});
afterEach(() => {
  TestBed.resetTestingModule();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (createDescriptor)
    Object.defineProperty(URL, 'createObjectURL', createDescriptor);
  else Reflect.deleteProperty(URL, 'createObjectURL');
  if (revokeDescriptor)
    Object.defineProperty(URL, 'revokeObjectURL', revokeDescriptor);
  else Reflect.deleteProperty(URL, 'revokeObjectURL');
});
const bytes = (blob: Blob) =>
  new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });

it('exportar a Excel conserva columnas, datos y nombre de archivo', async () => {
  const rows = [
    { name: 'Ana', total: 3 },
    { name: 'Diego', total: 7 },
  ];
  new ExportService().exportToExcel(rows, 'usuarios.xlsx');
  await vi.waitFor(() => expect(downloads[0]?.name).toBe('usuarios.xlsx'));
  const book = read(await bytes(downloads[0].blob), { type: 'array' });
  expect(utils.sheet_to_json(book.Sheets[book.SheetNames[0]])).toEqual(rows);
});

it('exportar a PDF conserva tabla, datos y nombre de archivo', async () => {
  let saved: { name: string; content: string } | undefined;
  const capture = [
    'initialized',
    function (this: jsPDF) {
      Object.defineProperty(this, 'save', {
        value: (name: string) => {
          saved = { name, content: this.output() };
          return this;
        },
      });
    },
  ];
  jsPDF.API.events.push(capture);
  try {
    new ExportService().exportToPdf(
      [{ name: 'Ana', total: 3 }],
      'usuarios.pdf',
    );
  } finally {
    jsPDF.API.events.splice(jsPDF.API.events.indexOf(capture), 1);
  }
  expect(saved?.name).toBe('usuarios.pdf');
  const content = saved!.content;
  expect(content.startsWith('%PDF-')).toBe(true);
  expect(content).toContain('(name)');
  expect(content).toContain('(Ana)');
});

it('Google Maps conserva el input y el evento changeComplete con la ubicación elegida', () => {
  let changed = () => {};
  const location = { lat: () => 14.6, lng: () => -90.5 } as google.maps.LatLng;
  let place: google.maps.places.PlaceResult = { geometry: { location } };
  const initialized = vi.fn();
  class Places {
    constructor(input: HTMLInputElement) {
      initialized(input);
    }
    addListener(event: string, listener: () => void) {
      expect(event).toBe('place_changed');
      changed = listener;
    }
    getPlace() {
      return place;
    }
  }
  vi.stubGlobal('google', { maps: { places: { Autocomplete: Places } } });
  TestBed.configureTestingModule({
    providers: [{ provide: NgxSpinnerService, useValue: {} }],
  });
  const fixture = TestBed.createComponent(AutocompleteGoogleMapsComponent);
  const emit = vi.fn();
  fixture.componentInstance.changeComplete.subscribe(emit);
  fixture.detectChanges();
  expect(initialized).toHaveBeenCalledWith(
    fixture.nativeElement.querySelector('input'),
  );
  changed();
  expect(emit).toHaveBeenCalledWith(location);
  place = {};
  changed();
  expect(emit).toHaveBeenCalledOnce();
});

it('la directiva de errores conserva la actualización al cambiar la validación', () => {
  const control = new FormControl('', Validators.required);
  const status = new Subject<string>();
  const container = { clear: vi.fn(), createEmbeddedView: vi.fn() };
  const template = {} as TemplateRef<unknown>;
  const directive = new DrErrorInputsDirective(
    template,
    container as unknown as ViewContainerRef,
    { control, statusChanges: status } as unknown as NgControl,
  );
  directive.drShowError = 'required';
  expect(container.createEmbeddedView).toHaveBeenCalledWith(template);
  container.createEmbeddedView.mockClear();
  control.setValue('Texto');
  status.next('VALID');
  expect(container.clear).toHaveBeenCalledTimes(2);
  expect(container.createEmbeddedView).not.toHaveBeenCalled();
});
