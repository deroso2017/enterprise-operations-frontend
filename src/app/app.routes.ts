import { Routes } from '@angular/router';

import { Login } from './features/auth/login';
import { Register } from './features/auth/register';
import { Dashboard } from './features/dashboard/dashboard';
import { authGuard } from './core/guard/auth.guard';
import { roleGuard } from './core/guard/role.guard';
import { InventoryPageComponent } from './features/inventory/pages/inventory-page/inventory-page.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'register',
    component: Register,
  },
  {
    path: 'dashboard',
    component: Dashboard,
    canActivate: [authGuard],
  },
  {
    path: 'inventory',
    component: InventoryPageComponent,
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    component: Dashboard,
    canActivate: [roleGuard],
    data: { roles: ['ADMIN'] },
  },

  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
