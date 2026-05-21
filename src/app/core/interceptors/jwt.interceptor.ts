import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, Observable, shareReplay, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { RefreshResponse } from '../models/user.model';

// Module-level singleton: while a refresh is in flight, every other 401'd
// request awaits the same response instead of triggering its own refresh call.
let refreshInFlight: Observable<RefreshResponse> | null = null;

export const jwtInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const auth = inject(AuthService);

  const token = auth.getToken();
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // Only handle 401 on non-auth endpoints when we have a token to refresh.
      // /auth/* is excluded so a failing login/refresh/logout doesn't recurse.
      const shouldRefresh =
        err.status === 401 && !!token && !req.url.includes('/auth/');

      if (!shouldRefresh) {
        return throwError(() => err);
      }

      refreshInFlight ??= auth.refreshToken().pipe(
        finalize(() => { refreshInFlight = null; }),
        shareReplay(1)
      );

      return refreshInFlight.pipe(
        switchMap(res => {
          const retryReq = req.clone({
            setHeaders: { Authorization: `Bearer ${res.accessToken}` }
          });
          return next(retryReq);
        }),
        catchError(refreshErr => {
          // Refresh itself failed (e.g. refresh token expired/revoked) — bounce to login.
          auth.logout(true);
          return throwError(() => refreshErr);
        })
      );
    })
  );
};
