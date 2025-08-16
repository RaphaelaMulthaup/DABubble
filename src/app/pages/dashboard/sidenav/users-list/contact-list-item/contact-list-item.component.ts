import { Component, Input } from '@angular/core';
import { UserInterface } from '../../../../../shared/models/user.interface';

@Component({
  selector: 'app-contact-list-item',
  imports: [],
  templateUrl: './contact-list-item.component.html',
  styleUrl: './contact-list-item.component.scss'
})
export class ContactListItemComponent {
   @Input() user!: UserInterface;

   wonnaBeFunction() {}
}


