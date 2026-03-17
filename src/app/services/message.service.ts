import { Injectable } from '@angular/core';
import { SignalRService } from './signalr.service';
import { CreateMessageModel, Message } from '../models/message';
import { Attachment } from '../models/attachment';
import { env } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DataService } from './data.service';

type AllowedMediaType = 'pdf' | 'png' | 'jpg' | 'webp';

@Injectable({
  providedIn: 'root',
})
export class MessageService {
  private baseApiUrl = env.baseApiUrl;
  private deviceId!: string;

  constructor(
    private signalR: SignalRService,
    private http: HttpClient,
    private dataService: DataService,
  ) {
    this.deviceId = this.dataService.deviceId;
  }

  getLatestMessages(
    fromDate?: Date,
    fromMessageWithId?: string,
    limit: number = 50,
  ): Observable<Message[]> {
    let params = new HttpParams().set('limit', limit.toString());

    if (fromDate) params = params.set('cursorDate', fromDate.toISOString());
    if (fromMessageWithId) params = params.set('cursorId', fromMessageWithId);

    return this.http.get<Message[]>(`${this.baseApiUrl}/api/messages`, { params });
  }

  onIncomingMessage(callback: Function) {
    this.signalR.buildConnection().registerListener('PushMessage', callback).start();
  }

  pushMessage(text?: string, files?: File[]): Observable<Message> {
    // Validation before sending
    if (!this.deviceId) {
      throw new Error('MessageService must be initialized with a device ID first');
    }

    if (!text && !files) {
      throw new Error('A message must have either text content or files to upload');
    }

    // Create form with files
    const formData = new FormData();

    formData.append('deviceId', this.deviceId);
    formData.append('dateTimeSent', new Date().toISOString());
    if (text) formData.append('text', text);

    files?.forEach((f, i) => {
      formData.append(`attachments[${i}].file`, f);
      formData.append(`attachments[${i}].queueOrder`, i.toString());
    });

    // Send to API
    return this.http.post<Message>(`${this.baseApiUrl}/api/message`, formData);
  }

  private isAllowedType(type: string): type is AllowedMediaType {
    return ['pdf', 'png', 'jpg', 'webp'].includes(type);
  }
}
