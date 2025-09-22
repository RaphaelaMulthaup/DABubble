import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderOutsideDashboardComponent } from '../../shared/components/header-outside-dashboard/header-outside-dashboard.component';

@Component({
  selector: 'app-privacy-policy',
  imports: [RouterLink, HeaderOutsideDashboardComponent],
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.scss'
})
export class PrivacyPolicyComponent implements OnInit {
  isPolice!: boolean;
  

  ngOnInit(): void {
      this.isPolice = true;
  }

  showLogo() {

  }
}