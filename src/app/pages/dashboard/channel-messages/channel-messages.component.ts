import { Component, inject } from '@angular/core';
import { ChannelSelectionService } from '../../../services/channel-selection.service';
import { ThreadService } from '../../../services/thread.service';
import { ChannelInterface } from '../../../shared/models/channel.interface';
import { MessageInterface } from '../../../shared/models/message.interface';

@Component({
  selector: 'app-channel-messages',
  imports: [],
  templateUrl: './channel-messages.component.html',
  styleUrl: './channel-messages.component.scss',
})
export class ChannelMessagesComponent {
  // Currently selected channel
  channel: ChannelInterface | null = null;

  // Injected service to manage channel selection
  private channelSelectionService = inject(ChannelSelectionService);

  // Injected service to manage threads
  private threadService = inject(ThreadService);

  // Map storing messages for each thread by threadId
  threadMessagesMap: { [threadId: string]: MessageInterface[] } = {};

  // List of all messages for the current channel
  messages: MessageInterface[] = [];

  // Component initialization
  ngOnInit() {
    // Subscribe to the currently selected channel
    this.channelSelectionService.selectedChannel$.subscribe((channel) => {
      this.channel = channel;
      this.messages = [];
      this.loadThreads(channel?.threads);
      console.log('messages', this.messages);
    });
  }

  /**
   * Loads messages for all threads in the channel
   * @param threadsObj Object containing threads information
   */
  loadThreads(
    threadsObj:
      | { [threadPathId: string]: { threadId: string; titleMessageId: string } }
      | undefined
  ) {
    if (!threadsObj || Object.keys(threadsObj).length === 0) {
      console.log('No threads available for this channel.');
      return;
    }

    // Loop through all threads and fetch messages
    Object.values(threadsObj).forEach((threadData) => {
      const threadId = threadData.threadId;

      // Subscribe to messages of the current thread
      this.threadService.getThreadMessages(threadId).subscribe((messages) => {
        // Convert Firestore timestamps to Date objects if necessary
        const messagesWithDate = messages.map((msg) => ({
          ...msg,
          createdAt: msg.createdAt.toDate
            ? msg.createdAt.toDate()
            : msg.createdAt,
        }));

        // Store messages in the threadMessagesMap
        this.threadMessagesMap[threadId] = messagesWithDate;

        // Merge all messages from threads into the main messages array
        messagesWithDate.forEach((message) => {
          this.messages.push(message);
        });
      });
    });
  }
}
