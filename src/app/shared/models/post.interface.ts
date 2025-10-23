import { Timestamp } from "@angular/fire/firestore";

export interface PostInterface {
  senderId: string;
  text: string;
  createdAt: Timestamp;
  ansCounter?: number;
  ansLastCreatedAt?: Timestamp;
  id?: string;
  channelId?:string;
  chatId?:string;
  channelName?: string;
  answer?: boolean;
  hasReactions?: boolean;
  parentMessageId?: string;
}