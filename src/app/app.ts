import { Component, HostListener, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { Toast } from './layouts/toast/toast';
import { DataService } from './services/data.service.js';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Toast],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    this.dataService.handleKeyboardCommand(event);
  }

  constructor(private themeService: ThemeService, private dataService: DataService) {}

  protected readonly title = signal('panchat-client');
}
