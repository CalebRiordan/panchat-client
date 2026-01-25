import { Observable, of } from 'rxjs';
import { Message } from '../models/message';
import { MessageService } from './message.service';

export class MockMessageService extends MessageService {
  override getLatestMessages(
    fromDate?: Date,
    fromMessageWithId?: string,
    limit?: number
  ): Observable<Message[]> {
    return of([
      {
        id: 'msg-001',
        deviceId: 'device-abc123',
        userId: 'user-001',
        content: 'Hey, how are you doing today?',
        contentType: 'text',
        dateTimeSent: new Date('2026-01-25T08:15:00Z'),
        queueOrder: 1,
      },
      {
        id: 'msg-002',
        deviceId: 'device-abc123',
        userId: 'user-001',
        content: 'Did you see the latest updates?',
        contentType: 'text',
        dateTimeSent: new Date('2026-01-25T08:32:00Z'),
        queueOrder: 2,
      },
      {
        id: 'msg-003',
        deviceId: 'device-abc123',
        userId: 'user-001',
        content: 'photo-2026-01-25.png',
        contentType: 'image/png',
        dateTimeSent: new Date('2026-01-25T09:10:00Z'),
        queueOrder: 3,
      },
      {
        id: 'msg-004',
        deviceId: 'device-abc123',
        userId: 'user-001',
        content: 'That sounds great!',
        contentType: 'text',
        dateTimeSent: new Date('2026-01-25T10:45:00Z'),
        queueOrder: 4,
      },
      {
        id: 'msg-005',
        deviceId: 'device-abc123',
        userId: 'user-001',
        content: 'document-report.pdf',
        contentType: 'application/pdf',
        dateTimeSent: new Date('2026-01-25T11:20:00Z'),
        queueOrder: 5,
      },
      {
        id: 'msg-006',
        deviceId: 'device-abc123',
        userId: 'user-001',
        content: 'Looking forward to our meeting tomorrow!',
        contentType: 'text',
        dateTimeSent: new Date('2026-01-25T14:30:00Z'),
        queueOrder: 6,
      },
      {
        id: 'msg-007',
        deviceId: '',
        userId: 'user-001',
        content: 'Thanks for your help earlier!',
        contentType: 'text',
        dateTimeSent: new Date('2026-01-25T15:00:00Z'),
        queueOrder: 7,
      },
      {
        id: 'msg-008',
        deviceId: '',
        userId: 'user-001',
        content: 'screenshot-2026-01-25.webp',
        contentType: 'image/webp',
        dateTimeSent: new Date('2026-01-25T15:45:00Z'),
        queueOrder: 8,
      },
      {
        id: 'msg-009',
        deviceId: '',
        userId: 'user-001',
        content: 'Can we reschedule to 3 PM?',
        contentType: 'text',
        dateTimeSent: new Date('2026-01-25T16:15:00Z'),
        queueOrder: 9,
      },
      {
        id: 'msg-010',
        deviceId: '',
        userId: 'user-001',
        content: 'presentation.pdf',
        contentType: 'application/pdf',
        dateTimeSent: new Date('2026-01-25T17:00:00Z'),
        queueOrder: 10,
      },
    ]);
  }

  override onIncomingMessage(callback: Function): void {}
}

//6841269b-5f01-47c8-b8b0-7a58f732f941
