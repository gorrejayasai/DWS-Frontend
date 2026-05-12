import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },

  // Public
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home').then(m => m.HomeComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'signup',
    loadComponent: () => import('./pages/signup/signup').then(m => m.SignupComponent)
  },

  // User pages (auth required)
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'wallet',
    loadComponent: () => import('./pages/wallet/wallet').then(m => m.WalletComponent),
    canActivate: [authGuard]
  },
  {
    path: 'transactions',
    loadComponent: () => import('./pages/transactions/transactions').then(m => m.TransactionsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'topup',
    loadComponent: () => import('./pages/topup/topup').then(m => m.TopupComponent),
    canActivate: [authGuard]
  },
  {
    path: 'transfer',
    loadComponent: () => import('./pages/transfer/transfer').then(m => m.TransferComponent),
    canActivate: [authGuard]
  },
  {
    path: 'withdraw',
    loadComponent: () => import('./pages/withdraw/withdraw').then(m => m.WithdrawComponent),
    canActivate: [authGuard]
  },
  {
    path: 'kyc',
    loadComponent: () => import('./pages/kyc/kyc').then(m => m.KycComponent),
    canActivate: [authGuard]
  },
  {
    path: 'notifications',
    loadComponent: () => import('./pages/notifications/notifications').then(m => m.NotificationsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },

  // Admin pages (admin role required)
  {
    path: 'admin',
    redirectTo: 'admin/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./pages/admin/dashboard/admin-dashboard').then(m => m.AdminDashboardComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/users',
    loadComponent: () => import('./pages/admin/users/admin-users').then(m => m.AdminUsersComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/kyc',
    loadComponent: () => import('./pages/admin/kyc/admin-kyc').then(m => m.AdminKycComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/transactions',
    loadComponent: () => import('./pages/admin/transactions/admin-transactions').then(m => m.AdminTransactionsComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/health',
    loadComponent: () => import('./pages/admin/health/admin-health').then(m => m.AdminHealthComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/settings',
    loadComponent: () => import('./pages/admin/settings/admin-settings').then(m => m.AdminSettingsComponent),
    canActivate: [adminGuard]
  },

  { path: '**', redirectTo: 'home' }
];
