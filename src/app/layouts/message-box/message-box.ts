import { Component, Input, OnInit, signal } from '@angular/core';
import { Message } from '../../models/message';
import { DataService } from '../../services/data.service';
import { AttachmentInfo, AttachmentUI } from '../../models/attachment';
import { AttachmentsViewerService } from '../../services/attachments-viewer.service';
import { AttachmentActionsService } from '../../services/attachment-actions.service';
import { AttachmentComponent } from '../attachment/attachment';
import { DOCUMENT_TYPES } from '../../shared/constants.js';
import { isPdf, isWord, urlFor } from '../../shared/utils.js';
import { isSupportedImage } from 'html2canvas/dist/types/css/types/image.js';

@Component({
  selector: 'app-message-box',
  imports: [AttachmentComponent],
  templateUrl: './message-box.html',
  styleUrl: './message-box.css',
})
export class MessageBox implements OnInit {
  deviceId!: string;
  imageUIs = signal<AttachmentUI[]>([]);
  docUIs = signal<AttachmentUI[]>([]);
  copyingUrl = signal<string | null>(null);
  copySuccessUrl = signal<string | null>(null);
  copyErrorUrl = signal<string | null>(null);
  private copyTimeouts = new Map<string, number>();

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
    const atts = this.message.attachments;
    
    // Separate attachments into images and docs
    const { images, docs } = atts.reduce(
      (acc, att) => {
        if (this.isDocumentType(att)) {
          acc.docs.push({ attachment: att, loaded: false });
        } else {
          acc.images.push({ attachment: att, loaded: false });
        }

        return acc;
      },
      { docs: [] as AttachmentUI[], images: [] as AttachmentUI[] },
    );

    this.imageUIs.set(images);
    this.docUIs.set(docs);
  }

  onImageLoad(url: string) {
    this.imageUIs.update((atts) =>
      atts.map((a) => (a.attachment.url == url ? { ...a, loaded: true } : a)),
    );
  }

  onAttachmentClick(index: number, event: MouseEvent) {
    const isCopyClick = event.ctrlKey || event.metaKey;
    const atms = this.imageUIs();

    if (isCopyClick) {
      this.copyAttachment(atms[index].attachment, event);
    } else {
      this.viewAttachment(index, event);
    }
  }

  viewAttachment(index: number, event: MouseEvent) {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    this.attachmentViewerService.show(this.imageUIs(), rect, index);
  }

  async copyAttachment(attachment: AttachmentInfo, event: MouseEvent) {
    event.stopPropagation();

    const url = attachment.url;

    // Clear any existing timeout for this attachment
    if (this.copyTimeouts.has(url)) {
      clearTimeout(this.copyTimeouts.get(url)!);
      this.copyTimeouts.delete(url);
    }

    // Set to loading state
    this.copyingUrl.set(url);
    this.copySuccessUrl.set(null);
    this.copyErrorUrl.set(null);

    // Perform the copy action
    const success = await this.attachmentActionsService.copyAttachment(
      attachment,
      this.message.text,
    );

    // Set to success or error state
    this.copyingUrl.set(null);
    if (success) {
      this.copySuccessUrl.set(url);
    } else {
      this.copyErrorUrl.set(url);
    }

    // Reset to normal state after 3 seconds
    const timeout = window.setTimeout(() => {
      this.copySuccessUrl.set(null);
      this.copyErrorUrl.set(null);
      this.copyTimeouts.delete(url);
    }, 2000);

    this.copyTimeouts.set(url, timeout);
  }

  onDownloadAttachment(attachment: AttachmentInfo, event: MouseEvent) {
    event.stopPropagation();
    this.attachmentActionsService.downloadAttachment(attachment);
  }

  isDocumentType(attachment: AttachmentInfo) {
    return DOCUMENT_TYPES.includes(attachment.type);
  }
}
