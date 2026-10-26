import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from '@auth/services/auth.service';
import { environment } from '@env/environment';
import { NgxSpinnerService } from 'ngx-spinner';
import { Observable, catchError, defer, finalize, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class InterceptorService implements HttpInterceptor {
  private pending = 0;
  constructor(
    public spinnerSvc: NgxSpinnerService,
    private auth: AuthService,
  ) {}
  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    const base = new URL(environment.api, window.location.origin);
    const url = new URL(req.url, window.location.origin);
    const apiPath = base.pathname.endsWith('/')
      ? base.pathname.slice(0, -1)
      : base.pathname;
    const isApi =
      url.origin === base.origin &&
      (url.pathname === apiPath || url.pathname.startsWith(apiPath + '/'));
    if (!isApi) return next.handle(req);
    const auth = this.auth.getAuth();
    const request = auth
      ? req.clone({ setHeaders: { Authorization: 'Bearer ' + auth.token } })
      : req;
    return defer(() => {
      if (++this.pending === 1) void this.spinnerSvc.show();
      return next.handle(request).pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401 && auth) this.auth.logout();
          const validation = error.error?.errors;
          const message =
            error.status === 0
              ? 'No se pudo conectar con el servidor. Inténtalo nuevamente.'
              : (error.error?.message ??
                (validation
                  ? Object.values(validation).flat().join('\n')
                  : error.status === 403
                    ? 'No tienes permisos para realizar esta acción.'
                    : error.status === 429
                      ? 'Demasiados intentos. Espera un momento antes de continuar.'
                      : 'No se pudo completar la solicitud.'));
          void import('sweetalert2').then(({ default: Swal }) =>
            Swal.fire({
              icon: 'error',
              title: 'Revisa la solicitud',
              text: message,
            }),
          );
          return throwError(() => error);
        }),
        finalize(() => {
          if (--this.pending === 0) void this.spinnerSvc.hide();
        }),
      );
    });
  }
}
