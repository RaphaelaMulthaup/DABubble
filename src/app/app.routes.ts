import { Routes } from '@angular/router';
import { AuthGuard } from './services/auth.guard';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { NonAuthComponent } from './pages/non-auth/non-auth.component';
import { ConfirmPasswordComponent } from './pages/non-auth/confirm-password/confirm-password.component';
import { ResetPasswordComponent } from './pages/non-auth/reset-password/reset-password.component';

export const routes: Routes = [
  { path: '', component: NonAuthComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
  },
  { path: '**', redirectTo: '' },
  { path: 'confirm', component: ConfirmPasswordComponent },
  { path: 'reset', component: ResetPasswordComponent }
];
