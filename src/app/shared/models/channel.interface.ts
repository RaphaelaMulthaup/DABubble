export interface ChannelInterface {
    id?: string; // Optional for Firestore documents
    createdBy: string;
    description?: string;
    memberIds: string[];
    name: string;
    threads?: {
        [threadPathId: string]: {
      threadId: string;
      titleMessageId: string;
    };
    };
    deleted: boolean;
    createdAt?: Date;
}