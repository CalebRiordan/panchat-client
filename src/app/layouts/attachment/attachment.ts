import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { AttachmentInfo, AttachmentUI } from '../../models/attachment';
import { DOCUMENT_TYPES } from '../../shared/constants';
import { isPdf, isWord, urlFor } from '../../shared/utils';

@Component({
  selector: 'app-attachment',
  imports: [],
  templateUrl: './attachment.html',
  styleUrl: './attachment.css',
})
export class AttachmentComponent {
  @Input() attachmentUI!: AttachmentUI;
  @Input() index!: number;
  @Input() totalCount!: number;
  @Input() isDocumentType!: boolean;
  @Input() copyingUrl!: string | null;
  @Input() copySuccessUrl!: string | null;
  @Input() copyErrorUrl!: string | null;

  @Output() attachmentClick = new EventEmitter<MouseEvent>();
  @Output() copyClick = new EventEmitter<AttachmentInfo>();
  @Output() downloadClick = new EventEmitter<AttachmentInfo>();
  @Output() imageLoad = new EventEmitter<string>();

  urlFor = (att: AttachmentInfo) => urlFor(att.type, att.url);

  onImageLoad(url: string) {
    this.imageLoad.emit(url);
  }

  onAttachmentClick(event: MouseEvent) {
    this.attachmentClick.emit(event);
  }

  onCopyClick(attachment: AttachmentInfo, event: MouseEvent) {
    event.stopPropagation();
    this.copyClick.emit(attachment);
  }

  onDownloadClick(attachment: AttachmentInfo, event: MouseEvent) {
    event.stopPropagation();
    this.downloadClick.emit(attachment);
  }

  shouldShowMoreOverlay(): boolean {
    if (this.isDocumentType) {
      // Show on 4th document (index 3)
      return this.index === 3 && this.totalCount > 3;
    } else {
      // Show on 3rd image (index 2)
      return this.index === 2 && this.totalCount > 2;
    }
  }

  getMoreCount(): number {
    return this.totalCount - (this.isDocumentType ? 3 : 2);
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
