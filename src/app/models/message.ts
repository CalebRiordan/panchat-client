export interface Message{
    id: string;
    deviceId: string;
    userId: string;
    content: string;
    contentType: string;
    DateTimeSent: Date;
    queueOrder: Number;
}