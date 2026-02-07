import { Component, NgZone, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';
import { finalize, Observable } from 'rxjs';

@Component({
  selector: 'app-session',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './session-component.html',
  styleUrl: './session-component.css',
})
export class SessionComponent implements OnInit {
  sessionForm!: FormGroup;
  usernameError = '';
  passwordError = '';
  awaitingResult = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.sessionForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(16)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(16)]],
    });
  }

  ngOnInit(): void {
    // Clear any error messages for form controls whose value changes
    this.sessionForm.valueChanges.subscribe(() => {
      Object.keys(this.sessionForm.controls).forEach((key) => {
        const control = this.sessionForm.get(key);

        this.usernameError = '';
        this.passwordError = '';

        if (control?.errors) {
          control.updateValueAndValidity({ emitEvent: false });
        }
      });
    });
  }

  private sendAuthRequest(actionFn: () => Observable<string>) {
    if (this.sessionForm.valid) {
      this.awaitingResult = true;

      actionFn()
        .pipe(finalize(() => (this.awaitingResult = false)))
        .subscribe({
          next: () => this.router.navigate(['/']),
          error: (errors: Record<string, string>) => this.handleAuthError(errors),
        });
    }
  }

  onLogin() {
    const { username, password } = this.sessionForm.value;
    this.sendAuthRequest(() => this.authService.login(username, password));
  }

  onSignUp() {
    const { username, password } = this.sessionForm.value;
    this.sendAuthRequest(() => this.authService.register(username, password));
  }

  private handleAuthError(errors: Record<string, string>): void {
    this.sessionForm.get('password')?.reset();

    Object.keys(errors).forEach((field) => {
      if (field == 'general') {
        this.passwordError = errors['general'];
      } else if (field == 'username') {
        this.usernameError = errors[field];
      } else if (field == 'password') {
        this.passwordError = errors[field];
      }
    });
  }

  formControl(controlName: string): string {
    return this.sessionForm.get(controlName)?.value ?? null;
  }

  getErrorMessage(controlName: string): string {
    const control = this.sessionForm.get(controlName);

    if (control && control.errors && control.touched) {
      // Check for the server error first
      if (control.errors['serverError']) {
        return control.errors['serverError'];
      }

      // Fall back to standard validation messages
      const displayName = controlName.charAt(0).toLowerCase() + controlName.slice(1);
      if (control.errors['required']) return `${displayName} is required`;
      if (control.errors['minlength'] || control.errors['maxlength']) {
        if (controlName == 'username') {
          return 'Username must be between 4 and 16 characters';
        } else if (controlName == 'password') {
          return 'Password must be between 8 and 16 characters';
        }
        return 'This field is required';
      }
    }

    return '';
  }
}
