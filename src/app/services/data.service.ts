import { Injectable, signal } from '@angular/core';
import { generateGuid } from '../shared/utils';

@Injectable({ providedIn: 'root' })
export class DataService {
  deviceId!: string;
  pasteCommand = signal(0);
  copyCommand = signal(0);

  constructor() {
    // Get device ID
    var tempDeviceId = localStorage.getItem('chat_device_id');
    if (!tempDeviceId) {
      tempDeviceId = crypto.randomUUID ? crypto.randomUUID() : generateGuid();
      localStorage.setItem('chat_device_id', tempDeviceId);
    }
    this.deviceId = tempDeviceId;
  }

  handleKeyboardCommand(event: KeyboardEvent) {
    const isControlPressed = event.ctrlKey || event.metaKey;

    if (isControlPressed) {
      switch (event.key.toLowerCase()) {
        case 'c':
          this.copyCommand.update((v) => v + 1);
          break;
        case 'v':
          this.pasteCommand.update((v) => v + 1);
          break;
        default:
          break;
      }
    }
  }
}
