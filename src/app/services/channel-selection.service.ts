import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ChannelInterface } from '../shared/models/channel.interface';

@Injectable({
  providedIn: 'root'
})
export class ChannelSelectionService {
  private selectedChannelSubject = new BehaviorSubject<ChannelInterface | null>(null);
  selectedChannel$ = this.selectedChannelSubject.asObservable();
  selectChannel(channel: ChannelInterface | null) {
    this.selectedChannelSubject.next(channel);
  }
  
  clearSelection() {
    this.selectedChannelSubject.next(null);
  }
}
