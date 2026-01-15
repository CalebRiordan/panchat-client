import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  constructor(private themeService: ThemeService) {
    let deviceId = localStorage.getItem('chat_device_id');

    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('chat_device_id', deviceId);
    }
  }

  protected readonly title = signal('panchat-client');
}
