import { Injectable, signal } from '@angular/core';
import { allowedTypes } from '../pages/chat/chat.component.js';

@Injectable({ providedIn: 'root' })
export class ClipboardService {
  pasteCommand = signal(0);
  copyCommand = signal(0);
  pastedFiles: File[] | null = null;
  pastedText: string | null = null;

  copy() {}

  paste(data: DataTransfer) {
    this.pastedFiles = null;
    this.pastedText = null;

    console.log("\nPASTE() IN CLIPBOARD SERVICE\n");
    
    // First check for any Clipboard files
    const uploadableFiles = Array.from(data.files).filter((f) => allowedTypes.includes(f.type));
    if (uploadableFiles.length > 0) {
      this.pastedFiles = uploadableFiles;
      this.pasteCommand.update((v) => v + 1);
      return;
    }

    // // Clipboard text, if no files
    const textItem = Array.from(data.items).find((i) => {
      return i.kind === 'string' && i.type === 'text/plain';
    });

    if (textItem) {
      textItem.getAsString((text) => {
        this.pastedText = text;
        this.pasteCommand.update((v) => v + 1);
      });
    }
  }

  handleKeyboardCommand() {}
}
