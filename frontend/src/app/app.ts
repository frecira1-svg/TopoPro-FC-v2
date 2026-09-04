import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Navbar } from './layout/components/navbar/navbar';
import { Sidebar } from './layout/components/sidebar/sidebar';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    Navbar,
    Sidebar
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('TopoPro');
  private themeService = inject(ThemeService);
}
