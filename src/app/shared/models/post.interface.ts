import { Timestamp } from "@angular/fire/firestore";

export interface PostInterface {
  senderId: string;
  text: string;
  createdAt: Timestamp;
  ansCounter?: Number;
  ansLastCreatedAt?: Timestamp;
  id?: string;
  channelId?:string;
  chatId?:string;
  channelName?: string;
  answer?: boolean;
  parentMessageId?: string;
}