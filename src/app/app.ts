import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { ApiHealth, ApiHealthService } from './core/services/api-health.service';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
})
export class App {
  private readonly apiHealthService = inject(ApiHealthService);

  readonly health = signal<ApiHealth | null>(null);
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);

  checkApi(): void {
    this.loading.set(true);
    this.error.set(null);

    this.apiHealthService.getHealth().subscribe({
      next: (result) => {
        this.health.set(result);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.health.set(null);
        this.error.set(
          err.status === 0
            ? 'Cannot reach the backend. Is Django running?'
            : `Backend returned HTTP ${err.status}.`,
        );
        this.loading.set(false);
      },
    });
  }
}
