import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ChannelInterface } from '../shared/models/channel.interface';

@Injectable({
  providedIn: 'root'
})
export class ChannelSelectionService {
  /** 
   * Subject holding the currently selected channel. 
   * Initialized with null (no channel selected). 
   */
  private selectedChannelSubject = new BehaviorSubject<ChannelInterface | null>(null);

  /** 
   * Observable for components to subscribe to channel selection changes. 
   */
  selectedChannel$ = this.selectedChannelSubject.asObservable();

  /**
   * Updates the currently selected channel.
   * @param channel The channel to select, or null to deselect.
   */
  selectChannel(channel: ChannelInterface | null) {
    this.selectedChannelSubject.next(channel);
  }

  /**
   * Retrieves the ID of the currently selected channel.
   * @returns The selected channel ID, or null if no channel is selected.
   */
  getSelectedChannelId(): string | null {
    const selectedChannel = this.selectedChannelSubject.getValue();
    return selectedChannel ? selectedChannel.id! : null;
  }

  /**
   * Clears the current channel selection.
   */
  clearSelection() {
    this.selectedChannelSubject.next(null);
  }
  
  /**
   * Retrieves the currently selected channel synchronously.
   * @returns The selected channel object, or null if none is selected.
   */
  getSelectedChannelSync(): ChannelInterface | null {
    return this.selectedChannelSubject.getValue();
  }
}
