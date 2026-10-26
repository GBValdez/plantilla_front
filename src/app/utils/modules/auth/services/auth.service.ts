import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { authUserInterface } from '@auth/interface/auth.inteface';
import { LocalStorageService } from '@utils/local-storage.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly authObs = new BehaviorSubject<authUserInterface | null>(null);
  constructor(
    private router: Router,
    private storage: LocalStorageService,
  ) {
    this.authObs.next(this.getAuth());
  }
  getObservable(): Observable<authUserInterface | null> {
    return this.authObs.asObservable();
  }
  nextAuth(auth: authUserInterface | null): void {
    this.authObs.next(auth);
  }
  hasAuth(): boolean {
    return this.getAuth() !== null;
  }
  setAuth(auth: authUserInterface): void {
    const roles = Array.isArray(auth.roles)
      ? auth.roles
      : [auth.roles].filter(Boolean);
    this.storage.setItem('auth', { ...auth, roles }, 1);
    this.authObs.next(this.getAuth());
  }
  getAuth(): authUserInterface | null {
    const auth = this.storage.getItem<authUserInterface>('auth');
    if (!auth) return null;
    try {
      const claims = jwtDecode<{ exp?: number }>(auth.token);
      if (
        !claims.exp ||
        claims.exp * 1000 <= Date.now() ||
        !Number.isFinite(new Date(auth.expiration).getTime()) ||
        new Date(auth.expiration).getTime() <= Date.now()
      )
        throw new Error('expired');
      return {
        ...auth,
        roles: Array.isArray(auth.roles)
          ? auth.roles
          : [auth.roles].filter(Boolean),
      };
    } catch {
      this.storage.removeItem('auth');
      if (this.authObs.value) this.authObs.next(null);
      return null;
    }
  }
  logout(): void {
    this.storage.removeItem('auth');
    this.authObs.next(null);
    void this.router.navigate(['/login']);
  }
  hasRoles(roles: string[]): boolean {
    const auth = this.getAuth();
    return !!auth && roles.some((role) => auth.roles.includes(role));
  }
}
