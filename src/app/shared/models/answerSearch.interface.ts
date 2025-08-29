import { MessageSearchInterface } from './messageSearch.interface';

export interface AnswerSearchInterface extends MessageSearchInterface {
  parentMessageId: string;
}
