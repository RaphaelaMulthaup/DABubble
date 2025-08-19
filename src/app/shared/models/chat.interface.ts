import { MessageInterface } from './message.interface';

export interface ChatInterface {
  id?: string;
  userIds: string[];
  lastMessageAt: any;
  messages?: MessageInterface[];
  threads?: {
    [threadPathId: string]: {
      threadId: string;
      titleMessageId: string;
    };
  };
}
