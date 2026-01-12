import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth';

export const guestGuard: CanActivateFn = (route, state) => {

  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()){
    router.navigate(['/']);
    return false;
  } else {
    return true;
  }
};

export const authGuard: CanActivateFn = (route, state) => {
  
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()){
    return true;
  } else {
    router.navigate(['/session']);
    return false;
  }
}