import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ClipboardService {
  pasteCommand = signal(0);
  copyCommand = signal(0);
  pastedFiles: File[] = [];
  pastedText: string = '';

  copy() {}

  paste(items: DataTransferItem[]) {
    const imageItems = items.filter((i) => i.kind === 'file' && i.type.startsWith('image/'));

    // Clipboard images
    if (imageItems.length > 0) {
    //   const blobs: File[] = [];
    //   for (const item of imageItems) {
    //     const blob = item.getAsFile();
    //     if (blob) blobs.push(blob);
    //   }

    //   this.pastedFiles = blobs;

    // TODO: Get pastedFiles to hold a FileList of files (possible without making new DataTransfer object?)
    this.pastedFiles = imageItems
      this.pastedText = "";
      this.pasteCommand.update(v => v + 1);
      return;
    }

    // Clipboard text, if no images
    const textItem = items.find((i) => i.kind === 'text' && i.type === 'text/plain');

    if (textItem) {
      textItem.getAsString((text) => {
        this.pastedText.set(text);
      });

      this.pasteCommand.update(v => v + 1);
    }
  }

  handleKeyboardCommand() {}
}
