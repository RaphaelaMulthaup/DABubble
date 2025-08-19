import { Routes } from '@angular/router';
import { AuthGuard } from './services/auth.guard';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { NonAuthComponent } from './pages/non-auth/non-auth.component';

export const routes: Routes = [
  { path: '', component: NonAuthComponent },
  {
    path: 'dashboard/:type/:id',
    component: DashboardComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
  },
  { path: '**', redirectTo: '' },
];
