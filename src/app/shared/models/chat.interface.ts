import { MessageInterface } from './message.interface';

export interface ChatInterface {
  id?: string;
  // brauche wir die UserID überhaupt, wenn die Chat id aus den user ids besteht?
  userIds?: string[];
  lastMessageAt?: any;
  messages?: MessageInterface[];
  threads?: {
    [threadPathId: string]: {
      threadId: string;
      titleMessageId: string;
    };
  };
}
