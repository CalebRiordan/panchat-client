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
    if (!this.deviceId) {
      throw new Error('MessageService must be initialized with a device ID first');
    }

    if (!text && !files) {
      throw new Error('A message must have either text content or files to upload');
    }

    const attachments = files?.map<Attachment>((f, i) => {
      return { file: f, dateTimeSent: new Date(), ...(files.length > 0 && { queueOrder: i }) };
    });

    const message: CreateMessageModel = {
      deviceId: this.deviceId,
      ...(text && { text: text }),
      dateTimeSent: new Date(),
      ...(attachments && { attachments: attachments }),
    };

    return this.http.post<Message>(`${this.baseApiUrl}/api/message`, message);
  }

  private isAllowedType(type: string): type is AllowedMediaType {
    return ['pdf', 'png', 'jpg', 'webp'].includes(type);
  }
}
