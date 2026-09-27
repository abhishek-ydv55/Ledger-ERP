import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, NavigationEnd, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

export interface Breadcrumb {
  label: string;
  url: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav aria-label="Breadcrumb" class="flex items-center text-xs font-medium">
      <ol class="inline-flex items-center space-x-1.5 md:space-x-2">
        <li class="inline-flex items-center">
          <a
            routerLink="/dashboard"
            class="text-espresso-400 dark:text-espresso-400 hover:text-brass-500 dark:hover:text-brass-400 inline-flex items-center transition-colors"
          >
            <svg class="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            Dashboard
          </a>
        </li>

        @for (item of breadcrumbs(); track item.url; let last = $last) {
          <li>
            <div class="flex items-center">
              <svg class="w-3.5 h-3.5 text-espresso-600 dark:text-espresso-600 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
              @if (!last) {
                <a
                  [routerLink]="item.url"
                  class="text-espresso-400 dark:text-espresso-400 hover:text-brass-500 dark:hover:text-brass-400 transition-colors ml-1"
                >
                  {{ item.label }}
                </a>
              } @else {
                <span class="text-stone-800 dark:text-stone-100 font-semibold ml-1 aria-current-page" aria-current="page">
                  {{ item.label }}
                </span>
              }
            </div>
          </li>
        }
      </ol>
    </nav>
  `
})
export class BreadcrumbComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly breadcrumbs = signal<Breadcrumb[]>([]);
  private routerSub?: Subscription;

  ngOnInit(): void {
    this.breadcrumbs.set(this.buildBreadcrumbs(this.route.root));
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.breadcrumbs.set(this.buildBreadcrumbs(this.route.root));
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  private buildBreadcrumbs(route: ActivatedRoute, url = '', breadcrumbs: Breadcrumb[] = []): Breadcrumb[] {
    const children: ActivatedRoute[] = route.children;
    if (children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {
      const routeURL: string = child.snapshot.url.map(segment => segment.path).join('/');
      if (routeURL !== '') {
        url += `/${routeURL}`;
      }

      const label = child.snapshot.data['breadcrumb'] || this.formatPathLabel(routeURL);

      if (label && routeURL !== 'dashboard') {
        const existing = breadcrumbs.find(b => b.url === url);
        if (!existing) {
          breadcrumbs.push({ label, url });
        }
      }

      return this.buildBreadcrumbs(child, url, breadcrumbs);
    }

    return breadcrumbs;
  }

  private formatPathLabel(path: string): string {
    if (!path) return '';
    const cleanPath = path.split('/')[0];
    return cleanPath
      .replace(/-/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }
}
