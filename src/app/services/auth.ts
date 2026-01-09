import { Injectable } from '@angular/core';
import { env } from '../../environments/environment';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, tap, throwError } from 'rxjs';

interface AuthResponse {
  token: string;
}
const LOGIN_ERROR_MAP: Record<string, string> = {
  Username: 'username',
  Password: 'password',
};

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseApiUrl = env.baseApiUrl;

  constructor(private http: HttpClient) {}

  private apiAuth(username: string, password: string, method: 'login' | 'register'): Observable<string> {
    return this.http.post<AuthResponse>(`${this.baseApiUrl}/${method}`, { username, password }).pipe(
      tap((res) => localStorage.setItem('jwt_token', res.token)),
      map((res) => res.token),
      catchError((err) => throwError(() => this.formatError(err)))
    );
  }

  login(username: string, password: string): Observable<string> {
    return this.apiAuth(username, password, 'login')
  }

  logout() {
    localStorage.removeItem('jwt_token');
  }

  register(username: string, password: string): Observable<string> {
    return this.apiAuth(username, password, 'register')
  }

  private formatError(err: HttpErrorResponse) {
    const result: Record<string, string> = {};

    // API returned object with error messages for multiple fields
    if (err.error?.errors) {
      Object.keys(err.error?.errors).forEach((serverError) => {
        const uiKey = LOGIN_ERROR_MAP[serverError];

        if (uiKey) {
          result[uiKey] = serverError[0]; // Take the first error message
        }
      });

      return result;
    }
    // API returned simple string error message
    else {
      result['general'] =
        typeof err.error === 'string'
          ? err.error
          : err.error?.message ?? 'An unknown error occurred';

      return result;
    }
  }
}
