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
  handleKeyboardEvent(event: KeyboardEvent) {
    // If user is already in an input or textarea, don't process this logic
    const activeElement = document.activeElement;
    if (activeElement?.tagName === 'TEXTAREA' || activeElement?.tagName === 'INPUT') {
      return;
    }

    // Don't interfere with system keyboard shortcuts (Ctrl+C, Ctrl+V, Ctrl+A)
    if (event.ctrlKey) {
      if (['a', 'c', 'v'].includes(event.key.toLowerCase())) {
        return; // These are handled by browser/other handlers
      }
      return; // Skip other Ctrl combinations
    }

    // Don't interfere with Alt and Meta key combinations
    if (event.altKey || event.metaKey) {
      return;
    }

    // Ignore standalone modifier keys
    const modifierKeys = ['Control', 'Shift', 'Alt', 'Meta'];
    if (modifierKeys.includes(event.key)) {
      return;
    }

    // Ignore special keys that shouldn't trigger focus
    const specialKeys = ['Tab', 'Escape', 'F5', 'F12'];
    if (specialKeys.includes(event.key) || event.key.startsWith('F')) {
      return;
    }

    // Focus the message input textarea so the character gets typed there
    const messageInput = document.querySelector('textarea.content') as HTMLTextAreaElement;
    if (messageInput) {
      messageInput.focus();
    }
  }

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
