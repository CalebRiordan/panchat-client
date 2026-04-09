import { Injectable, signal } from '@angular/core';
import { allowedTypes } from '../pages/chat/chat.component.js';

@Injectable({ providedIn: 'root' })
export class ClipboardService {
  pasteCommand = signal(0);
  copyCommand = signal(0);
  pastedFiles: File[] = [];
  pastedText?: string;

  copy() {}

  paste(data: DataTransfer) {
    const uploadableFiles = Array.from(data.files).filter((f) => allowedTypes.includes(f.type));
    console.log(uploadableFiles);
    if (uploadableFiles.length > 0) {
      this.pastedFiles = uploadableFiles;
      this.pastedText = '';
      this.pasteCommand.update((v) => v + 1);
      return;
    }
    // const imageItems = items.filter((i) => i.kind === 'file' && i.type.startsWith('image/'));

    // Clipboard images
    //   const blobs: File[] = [];
    //   for (const item of imageItems) {
    //     const blob = item.getAsFile();
    //     if (blob) blobs.push(blob);
    //   }

    //   this.pastedFiles = blobs;

    // Clipboard text, if no images
    const textItem = Array.from(data.items).find(
      (i) => i.kind === 'text' && i.type === 'text/plain',
    );

    if (textItem) {
      textItem.getAsString((text) => {
        this.pastedText = text;
      });

      this.pasteCommand.update((v) => v + 1);
    }
  }

  handleKeyboardCommand() {}
}
