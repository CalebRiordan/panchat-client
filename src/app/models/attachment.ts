export interface Attachment {
  file: File,
  dateTimeSent: Date;
  queueOrder?: Number;
}

export interface AttachmentInfo {
  url: string,
  type: string,
  dateTimeSent: Date,
  messageId: string,
  queueOrder?: Number
}

export interface AttachmentUI {
  attachment: AttachmentInfo;
  loaded: boolean;
}
