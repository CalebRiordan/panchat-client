import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  loginForm!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
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
        if (control?.errors) {
          control.setErrors(null);
        }
      });
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      // Login
      this.authService.login(this.formControl('email'), this.formControl('password')).subscribe({
        // Success logging in
        next: () => {
          this.router.navigate(['/']);
        },
        // Error logging in - Update form UI with server error messages
        error: (errors: Record<string, string>) => {
          Object.keys(errors).forEach((field) => {
            if (field == 'general') {
              this.loginForm.get('password')?.setErrors({ serverError: errors['general'] });
            } else {
              this.loginForm.get(field)?.setErrors({ serverError: errors[field] });
            }
          });
        },
      });
    }
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
      }
    }

    return '';
  }
}
