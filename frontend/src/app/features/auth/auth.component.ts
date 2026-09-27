import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { InputComponent } from '../../shared/components/input/input.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InputComponent, ButtonComponent],
  template: `
    <div class="min-h-screen w-full flex flex-col items-center justify-center bg-espresso-950 px-4 py-12 relative overflow-hidden select-none">
      <!-- Background subtle atmospheric radial glow -->
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brass-500/5 via-transparent to-transparent blur-3xl pointer-events-none"></div>

      <!-- Main Login Card (Single fade-in animation on load) -->
      <div class="w-full max-w-md bg-espresso-900/90 backdrop-blur-md border border-espresso-800/90 shadow-2xl rounded-2xl p-8 sm:p-10 z-10 animate-fade-in">
        
        <!-- Header / Brand Wordmark -->
        <div class="text-center mb-8">
          <h1 class="font-serif text-4xl sm:text-5xl font-normal text-stone-100 tracking-tight mb-2 selection:bg-brass-500 selection:text-espresso-950">
            Ledger
          </h1>
          <p class="text-[11px] uppercase tracking-[0.25em] text-espresso-400 font-medium">
            Multi-Tenant Enterprise System
          </p>
        </div>

        <!-- Inline Global API Error State -->
        @if (errorMessage) {
          <div class="mb-6 p-3.5 bg-danger-950/60 border border-danger-700/60 rounded-lg text-danger-300 text-xs flex items-start gap-2.5">
            <svg class="w-4 h-4 text-danger-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
            <div class="leading-relaxed font-medium">
              {{ errorMessage }}
            </div>
          </div>
        }

        <!-- Plain Form -->
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-5">
          <app-input
            id="email"
            label="Email Address"
            type="email"
            placeholder="admin@company.com"
            formControlName="email"
            [required]="true"
            [errorMessage]="getEmailErrorMessage()"
          ></app-input>

          <app-input
            id="password"
            label="Password"
            type="password"
            placeholder="••••••••"
            formControlName="password"
            [required]="true"
            [errorMessage]="getPasswordErrorMessage()"
          ></app-input>

          <div class="pt-2">
            <app-button
              type="submit"
              variant="brass"
              size="lg"
              [fullWidth]="true"
              [loading]="isLoading"
              [disabled]="loginForm.invalid"
            >
              Sign In to Ledger
            </app-button>
          </div>
        </form>

        <div class="mt-8 pt-6 border-t border-espresso-800/60 text-center">
          <p class="text-xs text-espresso-400">
            Secure Session &bull; Single-Tenant Row Isolation
          </p>
        </div>
      </div>
    </div>
  `
})
export class AuthComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  isLoading = false;
  errorMessage = '';

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]]
  });

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const credentials = {
      email: this.loginForm.value.email!,
      password: this.loginForm.value.password!
    };

    this.authService.login(credentials).subscribe({
      next: () => {
        this.isLoading = false;
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.isLoading = false;
        if (err.status === 401 || err.status === 400) {
          this.errorMessage = 'Invalid email or password. Please verify your credentials.';
        } else if (err.error?.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'Authentication failed. Please check backend connection and try again.';
        }
      }
    });
  }

  getEmailErrorMessage(): string {
    const control = this.loginForm.get('email');
    if (control && control.touched && control.errors) {
      if (control.errors['required']) return 'Email is required';
      if (control.errors['email']) return 'Please enter a valid email address';
    }
    return '';
  }

  getPasswordErrorMessage(): string {
    const control = this.loginForm.get('password');
    if (control && control.touched && control.errors) {
      if (control.errors['required']) return 'Password is required';
      if (control.errors['minlength']) return 'Password must be at least 4 characters';
    }
    return '';
  }
}
