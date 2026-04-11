import { Injectable, signal } from '@angular/core';
import { allowedTypes } from '../pages/chat/chat.component.js';

@Injectable({ providedIn: 'root' })
export class ClipboardService {
  pasteCommand = signal(0);
  copyCommand = signal(0);
  pastedFiles: File[] | null = null;
  pastedText: string | null = null;

  copy() {
    this.copyCommand.update((v) => v + 1);
  }

  paste(data: DataTransfer) {
    this.pastedFiles = null;
    this.pastedText = null;

    // First check for any Clipboard files
    const uploadableFiles = Array.from(data.files).filter((f) => allowedTypes.includes(f.type));
    if (uploadableFiles.length > 0) {
      this.pastedFiles = uploadableFiles;
    }

    // Clipboard text, if no files
    const textItem = Array.from(data.items).find((i) => {
      return i.kind === 'string' && i.type === 'text/plain';
    });

    if (textItem) {
      textItem.getAsString((text) => {
        console.log(`getAsString text: ${text}`);
        this.pastedText = text;
        this.pasteCommand.update((v) => v + 1);
      });
    } else this.pasteCommand.update((v) => v + 1);
  }

  async writeContent(getPngBlobFn: (text?: string | undefined) => Promise<Blob>, text?: string) {
    try {
      const clipboardData: Record<string, Blob | Promise<Blob>> = {};

      // Add Image Blob
      clipboardData['image/png'] = getPngBlobFn();

      // Add the Text (Must also be blob)
      if (text) {
        clipboardData['text/plain'] = new Blob([text], { type: 'text/plain' });
      }

      // Write blobs to clipboard
      const item = new ClipboardItem(clipboardData);
      await navigator.clipboard.write([item]);

      console.log('Successfully copied mixed content!');
    } catch (err) {
      console.error('Clipboard write failed:', err); // Not fatal
    }
  }

  handleKeyboardCommand() {}
}
