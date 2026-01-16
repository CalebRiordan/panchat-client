export interface Message {
  id: string;
  deviceId: string;
  userId: string;
  content: string;
  contentType: string;
  dateTimeSent: Date;
  queueOrder?: Number;
}

export interface CreateMessageModel {
  deviceId: string;
  content: string;
  dateTimeSent: Date;
  queueOrder?: Number;
}
