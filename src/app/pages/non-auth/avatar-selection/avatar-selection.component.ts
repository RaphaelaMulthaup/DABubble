import { Component } from '@angular/core';

@Component({
  selector: 'app-avatar-selection',
  imports: [],
  templateUrl: './avatar-selection.component.html',
  styleUrl: './avatar-selection.component.scss'
})
export class AvatarSelectionComponent {
  avatarOptions = [
    "avatar-option-1",
    "avatar-option-2",
    "avatar-option-3",
    "avatar-option-4",
    "avatar-option-5",
    "avatar-option-6",
  ]

  selectedAvatar: number = 0;

  constructor() { }

  selectAvatar(avatarOption: number) {
    this.selectedAvatar = avatarOption;
  }
}
