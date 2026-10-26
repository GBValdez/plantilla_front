import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  Router,
} from '@angular/router';
import { AuthService } from '@auth/services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private auth: AuthService,
  ) {}
  canActivate(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): boolean | UrlTree {
    const protection = route.data['isProtect'];
    if (protection === 25) return true;
    const authenticated = this.auth.hasAuth();
    if (protection === 30)
      return authenticated
        ? this.router.createUrlTree(['/session/dashboard'])
        : true;
    if (!authenticated) return this.router.createUrlTree(['/login']);
    const roles: string[] = route.data['roles'] ?? [];
    return !roles.length || this.auth.hasRoles(roles)
      ? true
      : this.router.createUrlTree(['/session/dashboard']);
  }
}
