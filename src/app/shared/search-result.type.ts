import { ChannelSearchInterface } from './models/channelSearch.interface';
import { MessageSearchInterface } from './models/messageSearch.interface';
import { AnswerSearchInterface } from './models/answerSearch.interface';
import { UserInterface } from './models/user.interface';

export type SearchResult =
  | (UserInterface & { type: 'user' })
  | (ChannelSearchInterface & { type: 'channel' })
  | (MessageSearchInterface & { type: 'chatMessage' })
  | (MessageSearchInterface & { type: 'channelMessage' })
  | (AnswerSearchInterface & { type: 'answer' });
