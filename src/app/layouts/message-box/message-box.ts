import { Component, computed, Input, OnInit, signal } from '@angular/core';
import { Message } from '../../models/message';
import { DataService } from '../../services/data.service';
import { AttachmentInfo, AttachmentUI } from '../../models/attachment';
import { AttachmentsViewerService } from '../../services/attachments-viewer.service';
import { AttachmentActionsService } from '../../services/attachment-actions.service';
import { AttachmentComponent } from '../attachment/attachment';
import { DOCUMENT_TYPES } from '../../shared/constants.js';

interface CopyFeedback {
  show: boolean;
  message: string;
}

@Component({
  selector: 'app-message-box',
  imports: [AttachmentComponent],
  templateUrl: './message-box.html',
  styleUrl: './message-box.css',
})
export class MessageBox implements OnInit {
  atts: AttachmentInfo[] = [];
  attUIs = signal<AttachmentUI[]>([]);
  copyFeedback = signal<CopyFeedback>({ show: false, message: '' });
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

  async copyAttachment(att: AttachmentInfo) {
    const success = await this.attachmentActionsService.copyAttachment(att, this.message.text);

    this.attUIs.update((atts) => {
      return atts.map((a) => (a.attachment.url == att.url ? { ...a, copied: success } : a));
    });

    // Show feedback tooltip
    const message = success ? 'Copied to clipboard' : 'Unsupported format';
    this.copyFeedback.set({ show: true, message });

    // Auto-hide after 2 seconds
    setTimeout(() => {
      this.copyFeedback.set({ show: false, message: '' });
    }, 2000);
  }

  async copy() {
    // If there's an attachment, copy it with the text
    if (this.attUIs().length > 0) {
      await this.copyAttachment(this.attUIs()[0].attachment);
    } else {
      // If no attachments, just show a feedback for text-only copy
      this.copyFeedback.set({ show: true, message: 'Copied to clipboard' });
      setTimeout(() => {
        this.copyFeedback.set({ show: false, message: '' });
      }, 2000);
    }
  }

  viewAttachment(index: number, event: MouseEvent) {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const att = this.attUIs()[index];

    if (att.type === 'img') {
      // Show images
      this.attachmentViewerService.showImages(this.imageUIs(), rect, index);
    } else {
      if (index == 3 && this.docUIs().length > 4) {
        // Show documents
        this.attachmentViewerService.showImages(this.docUIs(), rect, index);
      } else {
        // Show single document
        this.attachmentViewerService.openDoc(att);
      }
    }
  }

  isDocumentType(attachment: AttachmentInfo) {
    return DOCUMENT_TYPES.includes(attachment.type);
  }
}
