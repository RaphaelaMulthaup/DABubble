import { Component, Input, inject } from '@angular/core';
import { HeaderOverlayComponent } from '../../shared/components/header-overlay/header-overlay.component';
import { ChannelInterface } from '../../shared/models/channel.interface';
import { CommonModule } from '@angular/common';
import { SearchService } from '../../services/search.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, startWith, map, Observable } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { UserListItemComponent } from '../../shared/components/user-list-item/user-list-item.component';
import { UserInterface } from '../../shared/models/user.interface';
import { ChannelsService } from '../../services/channels.service';
import { Overlay } from '@angular/cdk/overlay';
import { OverlayService } from '../../services/overlay.service';

@Component({
  selector: 'app-add-member-to-channel',
  imports: [
    HeaderOverlayComponent,
    CommonModule,
    ReactiveFormsModule,
    UserListItemComponent,
  ],
  templateUrl: './add-member-to-channel.component.html',
  styleUrl: './add-member-to-channel.component.scss',
})
export class AddMemberToChannelComponent {
  @Input() channelDetails$?: Observable<ChannelInterface | undefined>;
  private searchService = inject(SearchService);
  private channelService = inject(ChannelsService);
  private overlayService = inject(OverlayService);

  ListWithMember: UserInterface[] = [];
  overlay:string= "";

  // Eingabefeld
  searchControl = new FormControl<string>('', { nonNullable: true });
  // Suchterm-Observable
  private term$: Observable<string> = this.searchControl.valueChanges.pipe(
    startWith(this.searchControl.value),
    debounceTime(300),
    map((v) => v.trim())
  );

  // Ergebnisse aus dem Service
  results = toSignal(
    this.searchService.searchHeaderSearch(this.term$) as Observable<
      UserInterface[]
    >,
    { initialValue: [] as UserInterface[] }
  );

  addMemberToArray(user: UserInterface) {
    const exists = this.ListWithMember.some(u => u.name === user.name);
    if(exists){
      return;
    }else{
      this.ListWithMember.push(user);
    }
  }
  removeFromList(index: number) {
    this.ListWithMember.splice(index, 1);
  }

  addMembertoChannel(channelId:string){
    const membersId = this.ListWithMember.map(user => user.uid);
    this.channelService.addMemberToChannel(channelId, membersId);
    this.overlayService.close();
  }
}
