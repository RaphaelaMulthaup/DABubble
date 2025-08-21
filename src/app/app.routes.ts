import { Routes } from '@angular/router';
import { AuthGuard } from './services/auth.guard';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { NonAuthComponent } from './pages/non-auth/non-auth.component';
import { OverlayComponent } from './overlay/overlay.component';
import { ProfileViewOtherUsersComponent } from './overlay/profile-view-other-users/profile-view-other-users.component';
import { CreateChannelFormComponent } from './overlay/create-channel-form/create-channel-form.component';

export const routes: Routes = [
  { path: '', component: NonAuthComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
  },
  { path: '**', redirectTo: '' },
];
