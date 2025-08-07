import { Routes } from '@angular/router';
import { provideRoutes } from '@angular/router';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'admin', loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent) },
  { path: 'delivery', loadComponent: () => import('./pages/delivery/delivery.component').then(m => m.DeliveryComponent) },
  { path: '**', redirectTo: 'login' },
];
