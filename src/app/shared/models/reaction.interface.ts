export interface ReactionInterface {
  emoji: { 
    token: string; 
    src: string 
  };
  users: string[];
  id?: string;
}
