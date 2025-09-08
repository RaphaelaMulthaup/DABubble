import { UserInterface } from '../models/user.interface';
import { ChannelInterface } from '../models/channel.interface';
import { PostInterface } from '../models/post.interface';

export type SearchResult =
  | (UserInterface & { type: 'user' })
  | (ChannelInterface & { type: 'channel' })
  | (PostInterface & { type: 'chatMessage'; user: UserInterface })
  | (PostInterface & { type: 'channelMessage'; channel: ChannelInterface })
  | { type: 'channelGroup'; channel: ChannelInterface; posts: PostInterface[] };