import { Component, Input, OnInit, signal } from '@angular/core';
import { Message } from '../../models/message';
import { DataService } from '../../services/data.service';
import { AttachmentInfo, AttachmentUI } from '../../models/attachment';
import { AttachmentsViewerService } from '../../services/attachments-viewer.service';

@Component({
  selector: 'app-message-box',
  imports: [],
  templateUrl: './message-box.html',
  styleUrl: './message-box.css',
})
export class MessageBox implements OnInit {
  deviceId!: string;
  attachmentUIs = signal<AttachmentUI[]>([]);

  @Input() message!: Message;
  @Input() sameDeviceAsPrevious!: Boolean;

  constructor(private dataService: DataService, private avs: AttachmentsViewerService) {
    this.deviceId = this.dataService.deviceId;
  }

  ngOnInit(): void {
    this.attachmentUIs.set(this.message.attachments.map((a) => ({ attachment: a, loaded: false })));
  }

  onImageLoad(url: string) {
    this.attachmentUIs.update((atts) =>
      atts.map((a) => (a.attachment.url == url ? { ...a, loaded: true } : a)),
    );
  }

  onAttachmentClick(index: number, event: MouseEvent) {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    this.avs.show(this.attachmentUIs(), rect, index);
  }
}
