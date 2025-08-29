import { MessageSearchInterface } from './models/messageSearch.interface';
import { AnswerSearchInterface } from './models/answerSearch.interface';
import { UserInterface } from './models/user.interface';
import { ChannelInterface } from './models/channel.interface';

export type SearchResult =
  | (UserInterface & { type: 'user' })
  | (ChannelInterface & { type: 'channel' })
  | (MessageSearchInterface & { type: 'chatMessage' })
  | (MessageSearchInterface & { type: 'channelMessage' })
  | (AnswerSearchInterface & { type: 'answer' });
