import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import {
  provideHttpClient,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';
import { InterceptorService } from '@utils/interceptor.service';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { APP_DATE_FORMATS } from '@utils/formatDate';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideMomentDateAdapter(APP_DATE_FORMATS),
    { provide: HTTP_INTERCEPTORS, useClass: InterceptorService, multi: true },
  ],
};
