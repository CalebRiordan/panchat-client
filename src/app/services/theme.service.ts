import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private isDarkMode = new BehaviorSubject<boolean>(!!localStorage.getItem('theme'));

  darkMode$ = this.isDarkMode.asObservable();

  constructor() {
    const theme = localStorage.getItem('theme');
    let isDarkMode = true; //default

    if (theme === 'light') {
      isDarkMode = false;
    } else if (theme !== 'dark') {
      localStorage.setItem('theme', 'dark');
    }

    this.applyTheme(isDarkMode);
  }

  toggleTheme() {
    this.applyTheme(!this.isDarkMode.getValue());
  }

  applyTheme(darkMode: boolean) {
    this.isDarkMode.next(darkMode);

    if (darkMode) {
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.remove('light-mode');
      document.documentElement.classList.add('dark-mode');
    } else {
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark-mode');
      document.documentElement.classList.add('light-mode');
    }
  }
}
