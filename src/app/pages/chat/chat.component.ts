import { Component, OnInit, signal } from '@angular/core';
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

  constructor(private messageService: MessageService) {}

  ngOnInit(): void {
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
}
