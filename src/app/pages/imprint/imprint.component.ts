import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderOutsideDashboardComponent } from '../../shared/components/header-outside-dashboard/header-outside-dashboard.component';

@Component({
  selector: 'app-imprint',
  imports: [RouterLink, HeaderOutsideDashboardComponent],
  templateUrl: './imprint.component.html',
  styleUrl: './imprint.component.scss'
})
export class ImprintComponent {

}
