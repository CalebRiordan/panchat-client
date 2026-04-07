import { Component, HostListener, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { Toast } from './layouts/toast/toast';
import { DataService } from './services/data.service.js';
import { ClipboardService } from './services/clipboard.service.js';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  constructor(private clipboardService: ClipboardService) {}

  protected readonly title = signal('panchat-client');

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {}

  @HostListener('window:paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    const clipboardItems = event.clipboardData?.items;
    if (!clipboardItems) return

    if (clipboardItems) this.clipboardService.paste(Array.from(clipboardItems));
    event.preventDefault();
  }

  @HostListener('window:copy', ['$event'])
  onCopy(event: ClipboardEvent) {}
}
