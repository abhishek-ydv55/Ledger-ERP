import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './shared/components/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      },
      {
        path: 'login',
        loadComponent: () => import('./features/auth/auth.component').then(m => m.AuthComponent)
      }
    ]
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        data: { breadcrumb: 'Dashboard' },
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'users',
        data: { breadcrumb: 'Users' },
        loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent)
      },
      {
        path: 'parties',
        data: { breadcrumb: 'Parties' },
        loadComponent: () => import('./features/parties/parties.component').then(m => m.PartiesComponent)
      },
      {
        path: 'items',
        data: { breadcrumb: 'Items & SKU' },
        loadComponent: () => import('./features/items/items.component').then(m => m.ItemsComponent)
      },
      {
        path: 'inventory',
        data: { breadcrumb: 'Inventory' },
        loadComponent: () => import('./features/inventory/inventory.component').then(m => m.InventoryComponent)
      },
      {
        path: 'sales',
        data: { breadcrumb: 'Sales' },
        loadComponent: () => import('./features/sales/sales.component').then(m => m.SalesComponent)
      },
      {
        path: 'purchases',
        data: { breadcrumb: 'Purchases' },
        loadComponent: () => import('./features/purchases/purchases.component').then(m => m.PurchasesComponent)
      },
      {
        path: 'payments',
        data: { breadcrumb: 'Payments' },
        loadComponent: () => import('./features/payments/payments.component').then(m => m.PaymentsComponent)
      },
      {
        path: 'banking',
        data: { breadcrumb: 'Banking' },
        loadComponent: () => import('./features/banking/banking.component').then(m => m.BankingComponent)
      },
      {
        path: 'accounting',
        data: { breadcrumb: 'Accounting' },
        loadComponent: () => import('./features/accounting/accounting.component').then(m => m.AccountingComponent)
      },
      {
        path: 'expenses',
        data: { breadcrumb: 'Expenses' },
        loadComponent: () => import('./features/expenses/expenses.component').then(m => m.ExpensesComponent)
      },
      {
        path: 'reports',
        data: { breadcrumb: 'Reports' },
        loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent)
      },
      {
        path: 'audit',
        data: { breadcrumb: 'Audit Log' },
        loadComponent: () => import('./features/audit/audit.component').then(m => m.AuditComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
