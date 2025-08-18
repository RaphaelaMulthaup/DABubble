import { MessageInterface } from "./message.interface";

export interface ChatInterface {
  id?: string;
  userIds: string[];
  lastMessageAt: any;
  messages?: MessageInterface[];
}
