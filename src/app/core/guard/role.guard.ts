import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.model';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = route.data['roles'] as UserRole[];

  return auth.restoreSession().pipe(
    map((user) => {
      if (!user) {
        return router.createUrlTree(['/login']);
      }

      if (allowedRoles.includes(user.role)) {
        return true;
      }

      return router.createUrlTree(['/dashboard']);
    }),
  );
};
