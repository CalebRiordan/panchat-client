import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  constructor() {
    this.applyTheme(this.getTheme());
  }

  toggleTheme() {
    this.applyTheme(this.oppositeTheme(this.getTheme()));
  }

  applyTheme(theme: 'dark' | 'light') {
    localStorage.setItem('theme', theme);

    document.documentElement.classList.remove(`${this.oppositeTheme(theme)}-mode`);
    document.documentElement.classList.add(`${theme}-mode`);
  }

  private getTheme() {
    const theme = localStorage.getItem('theme');
    return theme === 'light' ? 'light' : 'dark';
  }

  private oppositeTheme(theme: 'dark' | 'light') {
    return theme === 'dark' ? 'light' : 'dark';
  }
}
