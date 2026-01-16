import { Injectable } from '@angular/core';
import { SignalRService } from './signalR.service';
import { CreateMessageModel, Message } from '../models/message';
import { MediaMessage } from '../models/mediaMessage';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private deviceId!: string;

  constructor(private signalR: SignalRService) {
    signalR.startConnection();

    if (localStorage.getItem('chat_device_id')) {
      this.deviceId = crypto.randomUUID();
      localStorage.setItem('chat_device_id', this.deviceId);
    }
  }

  sendTextMessage(messageContent: string) {
    const message: CreateMessageModel = {
      deviceId: this.deviceId,
      content: messageContent,
      dateTimeSent: new Date(),
    };
  }

  sendMediaMessage(file: File, caption: string) {
    const mediaMessage: MediaMessage = {
      deviceId: this.deviceId,
      file: file,
      mediaType: file.type as 'pdf' | 'png' | 'jpg' | 'webp', // TODO: Clean this up
      dateTimeSent: new Date(),
      fileSize: file.size,
    };
  }
}
