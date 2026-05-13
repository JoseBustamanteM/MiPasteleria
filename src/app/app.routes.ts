import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'ventas/:fecha',
        loadComponent: () =>
          import('./features/ventas/productos-fecha/productos-fecha.component').then(m => m.ProductosFechaComponent)
      },
      {
        path: 'ventas/:fecha/:productoId',
        loadComponent: () =>
          import('./features/ventas/ventas-producto/ventas-producto.component').then(m => m.VentasProductoComponent)
      },
      {
        path: 'catalogo',
        loadComponent: () =>
          import('./features/catalogo/catalogo.component').then(m => m.CatalogoComponent)
      },
      {
        path: 'clientes',
        loadComponent: () =>
          import('./features/clientes/clientes.component').then(m => m.ClientesComponent)
      },
      {
        path: 'metodos-pago',
        loadComponent: () =>
          import('./features/metodo_pago/metodo-pago.component').then(m => m.MetodosPagoComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
