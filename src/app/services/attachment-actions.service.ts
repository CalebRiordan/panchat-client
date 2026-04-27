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

  async downloadAttachment(attachment: AttachmentInfo): Promise<void> {
    try {
      const response = await fetch(attachment.url, {
        method: 'GET',
        mode: 'cors',
      });

      if (!response.ok) throw new Error('Request for image failed');

      const blob = await response.blob();

      // Create a URL representing the blob data
      const localUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = localUrl;
      link.download = attachment.filename;

      // Append to DOM, click
      document.body.appendChild(link);
      link.click();

      // Cleanup (timeout ensures the browser handles the click before the URL is revoked)
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(localUrl);
      }, 100);

      this.toastService.show('Download started', 'success');
    } catch (error) {
      console.error('Download failed:', error);
      // If fetch fails (CORS), fall back to opening in a new tab
      window.open(attachment.url, '_blank');
      this.toastService.show('Opening in new tab (CORS restricted)', 'error');
    }
  }
}
