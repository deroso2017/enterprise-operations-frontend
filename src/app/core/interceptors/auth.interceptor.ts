import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);

  const isAuthEndpoint = /\/auth\/(login|register|refresh|logout)\/?$/.test(
    new URL(request.url, window.location.origin).pathname,
  );

  const accessToken = auth.accessToken;

  const authenticatedRequest =
    accessToken && !isAuthEndpoint
      ? request.clone({
          setHeaders: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
      : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        isAuthEndpoint ||
        !auth.refreshToken
      ) {
        return throwError(() => error);
      }

      return auth.refreshAccessToken().pipe(
        switchMap(() => {
          const refreshedToken = auth.accessToken;

          if (!refreshedToken) {
            auth.clearSession();
            return throwError(() => error);
          }

          return next(
            request.clone({
              setHeaders: {
                Authorization: `Bearer ${refreshedToken}`,
              },
            }),
          );
        }),
        catchError((refreshError: unknown) => {
          auth.clearSession();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
