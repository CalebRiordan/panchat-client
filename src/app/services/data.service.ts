import { Injectable, signal } from '@angular/core';
import { generateGuid } from '../shared/utils';

@Injectable({ providedIn: 'root' })
export class DataService {
  deviceId!: string;

  constructor() {
    // Get device ID
    var tempDeviceId = localStorage.getItem('chat_device_id');
    if (!tempDeviceId) {
      tempDeviceId = crypto.randomUUID ? crypto.randomUUID() : generateGuid();
      localStorage.setItem('chat_device_id', tempDeviceId);
    }
    this.deviceId = tempDeviceId;
  }
}
