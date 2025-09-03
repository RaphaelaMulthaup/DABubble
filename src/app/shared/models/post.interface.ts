import { Timestamp } from "@angular/fire/firestore";

export interface PostInterface {
  senderId: string;
  text: string;
  createdAt: Timestamp;
  id?: string;
  channelId?:string;
  chatId?:string;
  channelName?: string;
}