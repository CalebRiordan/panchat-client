import { Component, effect, ElementRef, OnInit, signal, ViewChild } from '@angular/core';
import { Message } from '../../models/message';
import { MessageService } from '../../services/message.service';
import { ToastService } from '../../services/toast.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-chat',
  imports: [],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent implements OnInit {
  messages = signal<Message[]>([]);
  sendingMessage = signal(false);
  deviceId!: string;

  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;

  constructor(
    private messageService: MessageService,
    private toastService: ToastService,
  ) {
    // Get device ID
    var tempDeviceId = localStorage.getItem('chat_device_id');
    if (!tempDeviceId) {
      tempDeviceId = crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2, 15);
      localStorage.setItem('chat_device_id', tempDeviceId);
    }
    this.deviceId = tempDeviceId;

    messageService.init(this.deviceId);

    effect(() => {
      const currentMessages = this.messages();

      if (currentMessages.length > 0) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }

  ngOnInit(): void {
    // Retrieve all messages
    if (this.messages.length == 0) {
      this.messageService.getLatestMessages().subscribe({
        next: (messages) => {
          console.log(`Retrieved ${messages.length} messages: ${messages}`);

          this.messages.set(messages);
        },
        error: (err) => {
          console.error('Error occurred while trying to retrieve messages: ' + err.message);
          this.toastService.show(
            'An error occurred trying to fetch message for this account',
            'error',
          );
        },
      });
    }

    // Listen for new messages
    this.messageService.onIncomingMessage((m: Message) => {
      console.log('Received message from websocket connection');

      this.messages.update((msgs) => [...msgs, m]);
    });
  }

  private scrollToBottom() {
    if (this.messagesContainer) {
      const el = this.messagesContainer.nativeElement;

      const distanceFromBottom = el.scrollHeight - el.clientHeight - el.scrollTop;

      if (distanceFromBottom < 100) {
        el.scroll({
          top: el.scrollHeight,
          left: 0,
          behaviour: 'smooth',
        });
      }
    }
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

  onSend(event?: Event) {
    const content = this.messageInput.nativeElement.value;
    event?.preventDefault();

    if (content) {
      this.sendingMessage.set(true);
      this.messageService
        .sendTextMessage(content)
        .pipe(finalize(() => this.sendingMessage.set(false)))
        .subscribe({
          next: () => {
            this.messageInput.nativeElement.style.height = 'auto';
            this.messageInput.nativeElement.style.overflowY = 'hidden';
            this.messageInput.nativeElement.value = '';
          },
          error: (err) => {
            console.error(err);
            this.toastService.show('An error occurred while trying to send your message', 'error');
          },
        });
    }
  }
}
