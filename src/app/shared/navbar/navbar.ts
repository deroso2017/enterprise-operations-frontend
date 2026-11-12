import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
})
export class Navbar {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  readonly mobileOpen = signal(false);

  readonly navLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Orders', path: '/orders' },
    { label: 'Inventory', path: '/inventory' },
  ];

  logout() {
    this.auth.logout().subscribe(() => this.router.navigate(['/login']));
  }
}
