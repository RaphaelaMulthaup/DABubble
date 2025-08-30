import { PostSearchInterface } from '../models/postSearch.interface';
import { AnswerSearchInterface } from '../models/answerSearch.interface';
import { UserInterface } from '../models/user.interface';
import { ChannelInterface } from '../models/channel.interface';

export type SearchResult =
  | (UserInterface & { type: 'user' })
  | (ChannelInterface & { type: 'channel' })
  | (PostSearchInterface & { type: 'chatMessage' })
  | (PostSearchInterface & { type: 'channelMessage' })
  | (AnswerSearchInterface & { type: 'answer' });
