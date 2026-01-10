import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login-component.html',
  styleUrl: './login-component.css',
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  usernameError = '';
  passwordError = '';

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(16)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(16)]],
    });
  }

  ngOnInit(): void {
    // Clear any error messages for form controls whose value changes
    this.loginForm.valueChanges.subscribe(() => {
      Object.keys(this.loginForm.controls).forEach((key) => {
        const control = this.loginForm.get(key);

        this.usernameError = '';
        this.passwordError = '';

        if (control?.errors) {
          control.updateValueAndValidity({ emitEvent: false });
        }
      });
    });
  }

  onLogin() {
    if (this.loginForm.valid) {
      this.authService.login(this.formControl('username'), this.formControl('password')).subscribe({
        next: () => this.router.navigate(['/']),
        error: (errors: Record<string, string>) => this.handleAuthError(errors),
      });
    }
  }

  onSignUp() {
    if (this.loginForm.valid) {
      this.authService
        .register(this.formControl('username'), this.formControl('password'))
        .subscribe({
          next: () => this.router.navigate(['/']),
          error: (errors: Record<string, string>) => this.handleAuthError(errors),
        });
    }
  }

  private handleAuthError(errors: Record<string, string>): void {
    console.log('handleAuthErrors()');

    Object.keys(errors).forEach((field) => {
      if (field == 'general') {
        this.passwordError = errors['general'];
      } else if (field == 'username') {
        this.usernameError = errors[field];
      } else if (field == 'password') {
        this.passwordError = errors[field];
      }

      this.cdr.detectChanges();
    });
  }

  formControl(controlName: string): string {
    return this.loginForm.get(controlName)?.value ?? null;
  }

  getErrorMessage(controlName: string): string {
    const control = this.loginForm.get(controlName);

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
