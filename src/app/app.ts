import { Component, HostListener, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { Toast } from './layouts/toast/toast';
import { ClipboardService } from './services/clipboard.service.js';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  // DONT REMOVE THE THEME SERVICE!
  constructor(
    private themeService: ThemeService,
    private clipboardService: ClipboardService,
  ) {}

  protected readonly title = signal('panchat-client');

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {}

  @HostListener('window:paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    if (event.clipboardData) this.clipboardService.paste(event.clipboardData);
    event.preventDefault();
  }

  @HostListener('window:copy', ['$event'])
  onCopy(event: ClipboardEvent) {
    const target = event.target as HTMLElement;
    this.clipboardService.copy();
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return; // Browser handles standard text copying
    }
  }
}
