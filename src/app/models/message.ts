import { Attachment, AttachmentInfo } from "./attachment";

export interface Message {
  id: string;
  deviceId: string;
  userId: string;
  text?: string;
  dateTimeSent: Date;
  attachments: AttachmentInfo[];
}

export interface CreateMessageModel {
  deviceId: string;
  text?: string;
  dateTimeSent: Date;
  attachments?: Attachment[];
}
