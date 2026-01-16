import { Component, OnInit } from '@angular/core';
import { Message } from '../../models/message';

@Component({
  selector: 'app-chat',
  imports: [],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css',
})
export class ChatComponent implements OnInit {
  messages: Message[] = [];

  ngOnInit(): void {
    // If messages is empty, fetch all messages from API
    // else, check for new messages from API
    // open websocket to receive new messages as they are sent

    if (this.messages.length == 0){

    }
  }
}
