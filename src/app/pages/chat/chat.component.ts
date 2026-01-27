import { AfterViewChecked, Component, ElementRef, OnInit, signal, ViewChild } from '@angular/core';
import { Message } from '../../models/message';
import { MessageService } from '../../services/message.service';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-chat',
  imports: [],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent implements OnInit, AfterViewChecked {
  messages = signal<Message[]>([]);
  deviceId!: string;

  @ViewChild('MessagesContainer') private messagesContainer!: ElementRef;

  constructor(private messageService: MessageService) {
    // Get device ID
    var tempDeviceId = localStorage.getItem('chat_device_id');
    if (!tempDeviceId) {
      tempDeviceId = crypto.randomUUID();
      localStorage.setItem('chat_device_id', tempDeviceId);
    }
    this.deviceId = tempDeviceId;

    messageService.init(this.deviceId);
  }

  ngOnInit(): void {
    // Retrieve all messages
    if (this.messages.length == 0) {
      this.messageService.getLatestMessages().subscribe({
        next: (messages) => {
          this.messages.set(messages);
        },
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

  ngAfterViewChecked(): void {
    this.scrollToBottom();
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

  onScroll(): void {}

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
