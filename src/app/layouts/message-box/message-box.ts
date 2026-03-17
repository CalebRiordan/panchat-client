import { Component, Input, OnInit, signal } from '@angular/core';
import { Message } from '../../models/message';
import { DataService } from '../../services/data.service';
import { AttachmentInfo } from '../../models/attachment';

interface AttachmentUI {
  attachment: AttachmentInfo;
  loaded: boolean;
}

@Component({
  selector: 'app-message-box',
  imports: [],
  templateUrl: './message-box.html',
  styleUrl: './message-box.css',
})
export class MessageBox implements OnInit{
  deviceId!: string;
  attachmentUIs = signal<AttachmentUI[]>([]);

  @Input() message!: Message;
  @Input() sameDeviceAsPrevious!: Boolean;

  constructor(private dataService: DataService) {
    this.deviceId = this.dataService.deviceId;
  }

  ngOnInit(): void {
    this.attachmentUIs.set(this.message.attachments.map((a) => ({ attachment: a, loaded: false })));
    console.log(this.message.attachments[0]?.url ?? `No url for message ${this.message.text}`);
  }

  onImageLoad(url: string) {
    this.attachmentUIs.update((atts) =>
      atts.map((a) => (a.attachment.url == url ? { ...a, loaded: true } : a)),
    );
  }
}
