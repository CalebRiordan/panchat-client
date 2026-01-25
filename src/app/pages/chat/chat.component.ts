import { Component, ElementRef, OnInit, signal } from '@angular/core';
import { Message } from '../../models/message';
import { MessageService } from '../../services/message.service';

@Component({
  selector: 'app-chat',
  imports: [],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent implements OnInit {
  messages = signal<Message[]>([]);
  deviceId!: string;

  constructor(private messageService: MessageService) {
    // Get device ID
    const deviceId = localStorage.getItem('chat_device_id');
    if (!deviceId) {
      this.deviceId = crypto.randomUUID();
      localStorage.setItem('chat_device_id', this.deviceId);
    }

    messageService.init(this.deviceId);
  }

  ngOnInit(): void {
    // Retrieve all messages
    if (this.messages.length == 0) {
      this.messageService.getLatestMessages().subscribe({
        next: (messages) => this.messages.set(messages),
        error: (err) => {
          console.error('Error occurred while trying to retrieve messages: ' + err.message);
          // TODO: Error popup
        },
      });
    }

    // Listen for new messages
    this.messageService.onIncomingMessage((m: Message) =>
      this.messages.update((msgs) => [...msgs, m])
    );
  }

  adjustHeight(el: HTMLTextAreaElement) {
    if (el.scrollHeight > 200) {
      el.style.height = 200 + 'px';
      el.style.overflowY = 'scroll';
      el.scrollTop = el.scrollHeight;
    } else {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
      el.style.overflowY = 'hidden';
    }
  }
}
