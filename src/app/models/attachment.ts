export interface Attachment {
  file: File,
  dateTimeSent: Date;
  queueOrder?: Number;
}

export interface AttachmentInfo {
  url: string,
  type: string,
  filename: string,
  pageCount?: number,
  size: number,
  dateTimeSent: Date,
  messageId: string,
  queueOrder?: Number
}

export interface AttachmentUI {
  attachment: AttachmentInfo;
  loaded: boolean;
}
