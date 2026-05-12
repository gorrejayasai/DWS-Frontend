import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedIn()) {
    router.navigate(['/login']);
    return false;
  }

  // Admins must use admin pages — block them from user pages
  if (auth.isAdmin()) {
    router.navigate(['/admin/dashboard']);
    return false;
  }

  return true;
};
