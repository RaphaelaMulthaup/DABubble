export interface MessageInterface {
  senderId: string;
  text: string;
  createdAt: any;
  id?: string;
  channelId?:string;
  chatId?:string;
}
