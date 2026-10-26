import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import {
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { LocalStorageService } from '@utils/local-storage.service';
import { AuthService } from '@auth/services/auth.service';
import { InterceptorService } from '@utils/interceptor.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { authUserInterface } from '@auth/interface/auth.inteface';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const jwt = (expires: number) =>
  btoa('{}') + '.' + btoa(JSON.stringify({ exp: expires })) + '.signature';
const session = (expires: number): authUserInterface => ({
  email: 'test@example.com',
  userName: 'tester',
  roles: ['ADMINISTRATOR'],
  expiration: new Date(expires * 1000),
  token: jwt(expires),
});
describe('Sesiones y solicitudes protegidas', () => {
  let auth: AuthService;
  let storage: LocalStorageService;
  let http: HttpClient;
  let backend: HttpTestingController;
  const spinner = { show: vi.fn(), hide: vi.fn() };
  beforeEach(() => {
    localStorage.clear();
    spinner.show.mockClear();
    spinner.hide.mockClear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: NgxSpinnerService, useValue: spinner },
        {
          provide: HTTP_INTERCEPTORS,
          useClass: InterceptorService,
          multi: true,
        },
      ],
    });
    storage = TestBed.inject(LocalStorageService);
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    backend.verify();
    localStorage.clear();
  });
  it('descarta un JWT vencido aunque permanezca en el almacenamiento', () => {
    storage.setItem('auth', session(Math.floor(Date.now() / 1000) - 10), 1);
    expect(auth.hasAuth()).toBe(false);
    expect(storage.hasItem('auth')).toBe(false);
  });
  it('recupera la sesión al recargar y normaliza un rol único', () => {
    storage.setItem('auth', {
      ...session(Math.floor(Date.now() / 1000) + 3600),
      roles: 'ADMINISTRATOR',
    });
    expect(auth.hasRoles(['ADMINISTRATOR'])).toBe(true);
  });
  it('tolera datos corruptos y elimina la entrada inválida', () => {
    localStorage.setItem('plantilla:auth', 'broken');
    expect(auth.getAuth()).toBeNull();
    expect(localStorage.getItem('plantilla:auth')).toBeNull();
  });
  it('envía el token únicamente a la API y no a un origen externo', () => {
    auth.setAuth(session(Math.floor(Date.now() / 1000) + 3600));
    http.get('/api/user').subscribe();
    backend.expectOne('/api/user').flush({});
    http.get('https://external.example/user').subscribe();
    const external = backend.expectOne('https://external.example/user');
    expect(external.request.headers.has('Authorization')).toBe(false);
    external.flush({});
  });
  it('no confunde rutas con prefijos similares con la API', () => {
    auth.setAuth(session(Math.floor(Date.now() / 1000) + 3600));
    http.get('/api-other/user').subscribe();
    const request = backend.expectOne('/api-other/user');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });
  it('conserva la carga hasta finalizar todas las solicitudes simultáneas', () => {
    http.get('/api/one').subscribe();
    http.get('/api/two').subscribe();
    backend.expectOne('/api/one').flush({});
    expect(spinner.hide).not.toHaveBeenCalled();
    backend.expectOne('/api/two').flush({});
    expect(spinner.show).toHaveBeenCalledTimes(1);
    expect(spinner.hide).toHaveBeenCalledTimes(1);
  });
  it('borra la sesión y sus permisos al salir', () => {
    auth.setAuth(session(Math.floor(Date.now() / 1000) + 3600));
    auth.logout();
    expect(auth.hasAuth()).toBe(false);
    expect(auth.authObs.value).toBeNull();
  });
});
