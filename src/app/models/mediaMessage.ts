export interface MediaMessage {
  deviceId: string;
  file: File,
  mediaType: "pdf" | "png" | "jpg" | "webp",
  dateTimeSent: Date;
  caption?: string;
  fileName?: string,
  fileSize: Number,
  queueOrder?: Number;
}