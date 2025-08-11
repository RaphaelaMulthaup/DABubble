export interface ChannelInterface {
    createdBy: string;
    description: string;
    memberIds: string[];
    name: string;
    threadIds: string[];
    deleted: boolean;
    createdAt?: Date;
}