import { PostSearchInterface } from './postSearch.interface';

export interface AnswerSearchInterface extends PostSearchInterface {
  parentMessageId: string;
}
