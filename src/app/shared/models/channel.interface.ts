export interface ChannelInterface {
    id?: string; // Optional for Firestore documents
    createdBy: string;
    description: string;
    memberIds: string[];
    name: string;
    threadIds: string[];
    deleted: boolean;
    createdAt?: Date;
}