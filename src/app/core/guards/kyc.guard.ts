import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { KycService } from '../services/kyc.service';

export const kycGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const kycSvc = inject(KycService);
  const router = inject(Router);

  const user = auth.getUser();
  if (!user?.userId) {
    router.navigate(['/kyc']);
    return false;
  }

  return kycSvc.getKycByUserId(user.userId).pipe(
    map(kyc => {
      if (kyc.status === 'APPROVED') return true;
      router.navigate(['/kyc']);
      return false;
    }),
    catchError(() => {
      // 404 = no KYC submitted yet, or service error — block access
      router.navigate(['/kyc']);
      return of(false);
    })
  );
};
