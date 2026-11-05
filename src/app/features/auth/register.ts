import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal(false);

  showPassword = signal(false);
  showConfirmPassword = signal(false);

  togglePasswordVisibility() {
    this.showPassword.update((value) => !value);
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.update((value) => !value);
  }

  readonly form = this.fb.nonNullable.group({
    first_name: ['', [Validators.required, Validators.maxLength(150)]],
    last_name: ['', [Validators.required, Validators.maxLength(150)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirm: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue();

    if (payload.password !== payload.password_confirm) {
      this.error.set('The passwords do not match.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.auth.register(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
        void this.router.navigate(['/login']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);

        if (err.status === 400 && err.error) {
          const errors = err.error as Record<string, unknown>;
          const emailError = errors['email'];

          this.error.set(
            Array.isArray(emailError)
              ? String(emailError[0])
              : 'Registration failed. Check your details and password.',
          );
          return;
        }

        this.error.set('Could not create your account. Please try again.');
      },
    });
  }
}
