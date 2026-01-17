import { Component, OnInit } from '@angular/core';
import { Message } from '../../models/message';
import { MessageService } from '../../services/message.service';

@Component({
  selector: 'app-chat',
  imports: [],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent implements OnInit {
  messages: Message[] = [];

  constructor(private messageService: MessageService) {}

  ngOnInit(): void {
    // If messages is empty, fetch all messages from API
    // else, check for new messages from API
    // open websocket to receive new messages as they are sent

    if (this.messages.length == 0) {
      this.messageService.getLatestMessages().subscribe({
        next: (messages) => (this.messages = messages),
        error: (err) => {
          console.error('Error occurred while trying to retrieve messages: ' + err.message);
          // TODO: Error popup
        },
      });
    }

    // Listen for new messages
    this.messageService.onIncomingMessage(this.messages.push);
  }
}
