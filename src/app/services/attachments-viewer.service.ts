import { Injectable, signal, WritableSignal } from '@angular/core';
import { AttachmentUI } from '../models/attachment';

@Injectable({ providedIn: 'root' })
export class AttachmentsViewerService {
  document = signal<AttachmentUI | undefined>(undefined);
  imageUIs = signal<AttachmentUI[]>([]);
  targetIndex = 0;
  targetRect?: DOMRect = undefined;
  stuntDouble: any;

  setAttachments() {}

  showImages(attachments: AttachmentUI[], targetImageRect: DOMRect, targetImageIndex: number) {
    this.imageUIs.set(attachments);
    this.targetIndex = targetImageIndex;
    this.targetRect = targetImageRect;
  }

  showDoc(document: AttachmentUI) {
    this.document.set(document);
  }

  clear() {
    this.imageUIs.set([]);
    this.document.set(undefined);
  }
}
