import { Injectable, signal } from '@angular/core';
import { AttachmentUI } from '../models/attachment';

@Injectable({ providedIn: 'root' })
export class AttachmentsViewerService {
  attachmentUIs = signal<AttachmentUI[]>([]);
  targetIndex = 0;
  targetRect?: DOMRect = undefined;
  stuntDouble: any;

  setAttachments() {}

  show(attachments: AttachmentUI[], targetImageRect: DOMRect, targetImageIndex: number) {
    this.attachmentUIs.set(attachments);
    this.targetIndex = targetImageIndex;
    this.targetRect = targetImageRect;
  }

  clear() {
    this.attachmentUIs.set([]);
  }
}
