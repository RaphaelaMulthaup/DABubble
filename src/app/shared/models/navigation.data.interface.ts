export interface NavigationData {
  type: 'chat' | 'channel';
  id: string;
  answerId: string;
  parentMessageId?: string;
}