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
  ) {}

  protected readonly title = signal('panchat-client');
}
