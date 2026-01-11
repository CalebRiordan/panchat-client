import { Injectable } from '@angular/core';
import { env } from '../../environments/environment';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, tap, throwError } from 'rxjs';

interface AuthResponse {
  token: string;
}
const AUTH_FIELDS: Array<string> = ['username', 'password'];

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseApiUrl = env.baseApiUrl;

  constructor(private http: HttpClient) {}

  private apiAuth(
    username: string,
    password: string,
    method: 'login' | 'register'
  ): Observable<string> {
    const url = `${this.baseApiUrl}Auth/${method}`;

    return this.http.post<AuthResponse>(url, { username, password }).pipe(
      tap((res) => {
        if (!res || !res.token){
          console.error("Unexpected response object format: ", res)
        }

        // Will throw error if parsing fails, caught by catchError operator
        localStorage.setItem('jwt_token', res.token);
      }),
      map((res) => res.token),
      catchError((err) => throwError(() => this.formatError(err)))
    );
  }

  login(username: string, password: string): Observable<string> {
    return this.apiAuth(username, password, 'login');
  }

  logout() {
    localStorage.removeItem('jwt_token');
  }

  register(username: string, password: string): Observable<string> {
    return this.apiAuth(username, password, 'register');
  }

  private formatError(err: HttpErrorResponse) {
    const result: Record<string, string> = {};
    const errors = err.error?.errors;

    // API returned object with error messages for multiple fields
    if (errors) {
      Object.keys(errors).forEach((fieldName) => {
        const localFieldName = fieldName.toLowerCase();
        if (AUTH_FIELDS.includes(localFieldName)) {
          result[localFieldName] = errors[fieldName][0]; // Take the first error message
        }
      });
    }
    // API returned simple string error message
    else {
      result['general'] =
        typeof err.error === 'string'
          ? err.error
          : err.error?.message ?? 'An unknown error occurred';
    }

    return result;
  }
}
