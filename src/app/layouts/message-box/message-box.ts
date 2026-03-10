import { Component, Input } from '@angular/core';
import { Message } from '../../models/message';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-message-box',
  imports: [],
  templateUrl: './message-box.html',
  styleUrl: './message-box.css',
})
export class MessageBox {
  deviceId!: string;

  @Input() message!: Message
  @Input() sameDeviceAsPrevious!: Boolean;

  constructor(private dataService: DataService){
    this.deviceId = this.dataService.deviceId;
  }

  onImageLoad(url: string){
    // Apply class to attachment
  }
}
