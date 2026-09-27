import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly themeKey = 'erp_theme';

  readonly theme = signal<ThemeMode>(this.getInitialTheme());

  constructor() {
    this.applyTheme(this.theme());
  }

  toggleTheme(): void {
    const nextTheme: ThemeMode = this.theme() === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
  }

  setTheme(newTheme: ThemeMode): void {
    this.theme.set(newTheme);
    localStorage.setItem(this.themeKey, newTheme);
    this.applyTheme(newTheme);
  }

  private getInitialTheme(): ThemeMode {
    const saved = localStorage.getItem(this.themeKey) as ThemeMode;
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
    return 'dark'; // Default to espresso dark theme per design system
  }

  private applyTheme(theme: ThemeMode): void {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }
}
