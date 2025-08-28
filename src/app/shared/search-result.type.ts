import { UserSearchInterface } from './models/userSearch.interface';
import { ChannelSearchInterface } from './models/channelSearch.interface';
import { MessageSearchInterface } from './models/messageSearch.interface';
import { AnswerSearchInterface } from './models/answerSearch.interface';

export type SearchResult =
  | (UserSearchInterface & { type: 'user' })
  | (ChannelSearchInterface & { type: 'channel' })
  | (MessageSearchInterface & { type: 'chatMessage' })
  | (MessageSearchInterface & { type: 'channelMessage' })
  | (AnswerSearchInterface & { type: 'answer' });
