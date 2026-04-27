import { Component, computed, Input, OnInit, signal } from '@angular/core';
import { Message } from '../../models/message';
import { DataService } from '../../services/data.service';
import { AttachmentInfo, AttachmentUI } from '../../models/attachment';
import { AttachmentsViewerService } from '../../services/attachments-viewer.service';
import { AttachmentActionsService } from '../../services/attachment-actions.service';
import { AttachmentComponent } from '../attachment/attachment';
import { DOCUMENT_TYPES } from '../../shared/constants.js';

@Component({
  selector: 'app-message-box',
  imports: [AttachmentComponent],
  templateUrl: './message-box.html',
  styleUrl: './message-box.css',
})
export class MessageBox implements OnInit {
  atts: AttachmentInfo[] = [];
  attUIs = signal<AttachmentUI[]>([]);
  deviceId!: string;
  readonly imageUIs = computed(() => this.attUIs().filter((a) => a.type === 'img'));
  readonly docUIs = computed(() => this.attUIs().filter((a) => a.type === 'doc'));

  @Input() message!: Message;
  @Input() sameDeviceAsPrevious!: Boolean;

  constructor(
    private dataService: DataService,
    private attachmentViewerService: AttachmentsViewerService,
    private attachmentActionsService: AttachmentActionsService,
  ) {
    this.deviceId = this.dataService.deviceId;
  }

  ngOnInit(): void {
    const attUIs = this.message.attachments.map((a, index) => {
      const type: 'doc' | 'img' = this.isDocumentType(a) ? 'doc' : 'img';
      return { attachment: a, loaded: false, type, index };
    });

    this.attUIs.set(attUIs);
  }

  async onCopy(att: AttachmentInfo) {
    const success = await this.attachmentActionsService.copyAttachment(att, this.message.text);

    this.attUIs.update((atts) => {
      return atts.map((a) => (a.attachment.url == att.url ? { ...a, copied: success } : a));
    });

    if (success) {
      console.log('Successfully copied image and text');
    } else {
      // TODO: Show toast error
    }
  }

  viewAttachment(index: number, event: MouseEvent) {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const att = this.attUIs()[index];
    if (att.type === 'img') {
      this.attachmentViewerService.showImages(this.attUIs(), rect, index);
    } else {
      this.attachmentViewerService.showDoc(att);
    }
  }

  isDocumentType(attachment: AttachmentInfo) {
    return DOCUMENT_TYPES.includes(attachment.type);
  }
}
