import { Component } from '@angular/core';
import { AuthService } from '../../services/auth';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  constructor(
    private authService: AuthService,
    private themeService: ThemeService,
  ) {}

  onToggleTheme() {
    this.themeService.toggleTheme();
  }

  onLogout() {
    this.authService.logout();
  }
}
