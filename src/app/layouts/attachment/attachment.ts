import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  model,
  effect,
} from '@angular/core';
import { AttachmentInfo, AttachmentUI } from '../../models/attachment';
import { isPdf, isWord, urlFor } from '../../shared/utils';
import { AttachmentActionsService } from '../../services/attachment-actions.service.js';

@Component({
  selector: 'app-attachment',
  imports: [],
  templateUrl: './attachment.html',
  styleUrl: './attachment.css',
})
export class AttachmentComponent {
  attachmentUI = model.required<AttachmentUI>();

  @Input() index!: number;
  @Input() totalCount!: number;

  @Output() attachmentClick = new EventEmitter<MouseEvent>();
  @Output() copyClick = new EventEmitter<AttachmentInfo>();
  @Output() downloadClick = new EventEmitter<AttachmentInfo>();

  private copyTimeouts = new Map<string, number>();
  copyingUrl = signal<string | null>(null);
  copySuccessUrl = signal<string | null>(null);
  copyErrorUrl = signal<string | null>(null);

  urlFor = (att: AttachmentInfo) => urlFor(att.type, att.url);

  constructor(private attachmentActionsService: AttachmentActionsService) {
    effect(() => {
      const copyResult = this.attachmentUI().copied;
      console.log(`Effect triggered - copied: ${copyResult}`);
      if (copyResult != undefined) {
        this.updateCopyIcon(copyResult);
      }
    });
  }

  onImageLoad() {
    this.attachmentUI.update((att) => ({ ...att, loaded: true }));
  }

  onAttachmentClick(attachment: AttachmentInfo, event: MouseEvent) {
    const isCopyClick = event.ctrlKey || event.metaKey;

    if (isCopyClick) {
      this.copyAttachment(attachment);
    } else {
      this.attachmentClick.emit(event);
    }
  }

  async onCopyClick(attachment: AttachmentInfo) {
    await this.copyAttachment(attachment);
  }

  async copyAttachment(attachment: AttachmentInfo) {
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
    this.copyClick.emit(attachment);
  }

  updateCopyIcon(success: boolean) {
    const url = this.attachmentUI().attachment.url;

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

  onDownloadClick(attachment: AttachmentInfo) {
    this.attachmentActionsService.downloadAttachment(attachment);
  }

  shouldShowMoreOverlay(): boolean {
    if (this.attachmentUI().type == 'doc') {
      // Show on 4th document (index 3)
      return this.index === 3 && this.totalCount > 3;
    } else {
      // Show on 3rd image (index 2)
      return this.index === 2 && this.totalCount > 2;
    }
  }

  getMoreCount(): number {
    return this.totalCount - (this.attachmentUI().type === 'doc' ? 3 : 2);
  }

  formatInfo(att: AttachmentInfo) {
    let s = '';
    if (att.pageCount) {
      s = `${att.pageCount} pages  `;
    }

    let type = '';
    if (isPdf(att.type, att.filename)) {
      type = '  PDF';
    } else if (isWord(att.type, att.filename)) {
      type = '  DOCX';
    }

    const sizeMB = Math.round((att.size / 1024 / 1024) * 10) / 10;
    s += `${sizeMB}MB${type}`;

    return s;
  }
}
