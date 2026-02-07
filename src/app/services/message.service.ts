import { Injectable } from '@angular/core';
import { SignalRService } from './signalr.service';
import { CreateMessageModel, Message } from '../models/message';
import { MediaMessage } from '../models/mediaMessage';
import { env } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

type AllowedMediaType = 'pdf' | 'png' | 'jpg' | 'webp';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private baseApiUrl = env.baseApiUrl;
  private deviceId!: string;

  constructor(private signalR: SignalRService, private http: HttpClient) {}

  init(deviceId: string){
    this.deviceId = deviceId;
  }

  getLatestMessages(fromDate?: Date, fromMessageWithId?: string, limit: number = 50): Observable<Message[]> {
    let params = new HttpParams().set('limit', limit.toString());

    if (fromDate) params = params.set('cursorDate', fromDate.toISOString());
    if (fromMessageWithId) params = params.set('cursorId', fromMessageWithId);

    return this.http.get<Message[]>(`${this.baseApiUrl}/api/messages`, { params });
  }

  onIncomingMessage(callback: Function){
    this.signalR.buildConnection().registerListener("ReceiveMessage", callback).start();
  }

  // Send text message
  sendTextMessage(messageContent: string): Observable<Message> {
    if (!this.deviceId){
        throw new Error("MessageService must be initialized with a device ID first");
    }

    const message: CreateMessageModel = {
      deviceId: this.deviceId,
      content: messageContent,
      dateTimeSent: new Date(),
    };

    return this.http.post<Message>(`${this.baseApiUrl}/api/message`, message);
  }

  // Send message with media attachment
  sendMediaMessage(file: File, caption: string): Observable<Message> {
    if (!this.deviceId){
        throw new Error("MessageService must be initialized with a device ID first");
    }

    const fileType = file.type.split('/')[1];
    if (!this.isAllowedType(fileType)) {
      throw new Error('Unsupported file type');
    }

    const mediaMessage: MediaMessage = {
      deviceId: this.deviceId,
      file: file,
      mediaType: fileType,
      dateTimeSent: new Date(),
      fileSize: file.size,
      caption: caption,
    };

    return this.http.post<Message>(`${this.baseApiUrl}/api/message/upload`, mediaMessage);
  }

  private isAllowedType(type: string): type is AllowedMediaType {
    return ['pdf', 'png', 'jpg', 'webp'].includes(type);
  }
}
