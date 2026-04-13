import { Injectable } from '@angular/core';
import { AttachmentInfo } from '../models/attachment';
import { convertToPngBlob } from '../shared/utils';
import { ClipboardService } from './clipboard.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class AttachmentActionsService {
  constructor(
    private clipboardService: ClipboardService,
    private toastService: ToastService,
  ) {}

  async copyAttachment(attachment: AttachmentInfo, messageText?: string): Promise<boolean> {
    try {
      let getBlobFn;

      // Determine how to get blob based on file type
      switch (attachment.type) {
        case 'image/png':
          getBlobFn = async () => (await fetch(attachment.url)).blob();
          break;
        case 'image/jpeg':
          getBlobFn = async () => convertToPngBlob(attachment.url);
          break;
        default:
          this.toastService.show('Copy is only supported for PNG and JPEG images', 'error');
          return false;
      }

      await this.clipboardService.writeContent(getBlobFn, messageText ?? '');
      return true;
    } catch (error) {
      console.error('Error copying attachment:', error);
      this.toastService.show('Failed to copy image to clipboard', 'error');
      return false;
    }
  }

  downloadAttachment(attachment: AttachmentInfo): void {
    try {
      const link = document.createElement('a');
      link.href = attachment.url;
      link.download = this.getFilenameFromUrl(attachment.url);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.toastService.show('Download started', 'success');
    } catch (error) {
      console.error('Error downloading attachment:', error);
      this.toastService.show('Failed to download image', 'error');
    }
  }

  private getFilenameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return pathname.substring(pathname.lastIndexOf('/') + 1) || 'download';
    } catch {
      return 'download';
    }
  }
}
