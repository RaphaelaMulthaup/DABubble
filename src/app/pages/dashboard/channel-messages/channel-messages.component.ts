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
  channel: ChannelInterface | null = null;
  private channelSelectionService = inject(ChannelSelectionService);
  private threadService = inject(ThreadService);
  threadMessagesMap: { [threadId: string]: MessageInterface[] } = {};
  messages: MessageInterface[] = [];
  ngOnInit() {
    this.channelSelectionService.selectedChannel$.subscribe((channel) => {
      this.channel = channel;
      this.messages = [];
      this.loadThreads(channel?.threads);
      console.log('messages', this.messages);
    });
  }

  loadThreads(
    threadsObj:
      | { [threadPathId: string]: { threadId: string; titleMessageId: string } }
      | undefined
  ) {
    if (!threadsObj || Object.keys(threadsObj).length === 0) {
      console.log('No threads available for this channel.');
      return;
    }

    Object.values(threadsObj).forEach((threadData) => {
      const threadId = threadData.threadId;
      this.threadService.getThreadMessages(threadId).subscribe((messages) => {
        const messagesWithDate = messages.map((msg) => ({
          ...msg,
          createdAt: msg.createdAt.toDate
            ? msg.createdAt.toDate()
            : msg.createdAt,
        }));

        this.threadMessagesMap[threadId] = messagesWithDate;

        // Alle Nachrichten für diese Threads zusammenführen
        messagesWithDate.forEach((message) => {
          this.messages.push(message);
        });
      });
    });
  }
}
