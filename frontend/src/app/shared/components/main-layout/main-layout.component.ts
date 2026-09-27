import { Component, QueryList, ViewChildren, AfterViewInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { OverlayModule } from '@angular/cdk/overlay';
import { A11yModule, FocusKeyManager } from '@angular/cdk/a11y';
import { AuthService } from '../../../core/services/auth.service';
import { TenantService } from '../../../core/services/tenant.service';
import { ThemeService } from '../../../core/services/theme.service';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { NavItemDirective } from '../../directives/nav-item.directive';
import { ToastContainerComponent } from '../toast/toast-container.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

export interface NavItem {
  label: string;
  route: string;
  iconPath: string;
  badge?: string;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    OverlayModule,
    A11yModule,
    BreadcrumbComponent,
    NavItemDirective,
    ToastContainerComponent,
    ConfirmDialogComponent
  ],
  template: `
    <div class="min-h-screen flex bg-stone-50 text-stone-900 dark:bg-espresso-950 dark:text-stone-100 font-sans transition-colors duration-200">
      
      <!-- Mobile Drawer Backdrop -->
      @if (isMobileOpen()) {
        <div
          (click)="closeMobileDrawer()"
          class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          aria-hidden="true"
        ></div>
      }

      <!-- Left Sidebar (Desktop & Mobile Drawer) -->
      <aside
        [class]="sidebarClasses"
        aria-label="Main Navigation"
        cdkTrapFocus
      >
        <!-- Sidebar Brand Header -->
        <div class="h-16 flex items-center justify-between px-4 border-b border-stone-200 dark:border-espresso-800/80 shrink-0">
          <a routerLink="/dashboard" class="flex items-center space-x-3 overflow-hidden focus:outline-none focus:ring-2 focus:ring-brass-400 rounded-lg p-1">
            <div class="w-8 h-8 rounded-lg bg-brass-500 text-espresso-950 flex items-center justify-center font-serif font-bold text-lg shadow-md shrink-0">
              L
            </div>
            @if (!isCollapsed() || isMobileOpen()) {
              <span class="font-serif text-2xl font-normal text-stone-900 dark:text-stone-100 tracking-tight transition-opacity duration-200">
                Ledger
              </span>
            }
          </a>

          <!-- Collapse Toggle Button (Desktop) -->
          <button
            (click)="toggleCollapse()"
            type="button"
            class="hidden md:flex p-1.5 rounded-lg text-stone-500 dark:text-espresso-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-espresso-800/60 transition-colors focus:outline-none focus:ring-2 focus:ring-brass-400"
            [title]="isCollapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
            [attr.aria-expanded]="!isCollapsed()"
            aria-label="Toggle sidebar collapse"
          >
            <svg class="w-5 h-5 transform transition-transform duration-200" [class.rotate-180]="isCollapsed()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
            </svg>
          </button>

          <!-- Close Drawer Button (Mobile) -->
          <button
            (click)="closeMobileDrawer()"
            type="button"
            class="md:hidden p-1.5 rounded-lg text-stone-500 dark:text-espresso-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-espresso-800/60 focus:outline-none focus:ring-2 focus:ring-brass-400"
            aria-label="Close navigation menu"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Navigation Menu Items (A11y keyboard navigable via CDK FocusKeyManager) -->
        <nav
          class="flex-1 overflow-y-auto px-3 py-4 space-y-1 select-none"
          role="navigation"
          aria-label="Sidebar Modules"
          (keydown)="onNavKeydown($event)"
        >
          @for (item of navItems; track item.route; let idx = $index) {
            <a
              appNavItem
              [routerLink]="item.route"
              routerLinkActive="bg-brass-500/10 text-brass-700 dark:text-brass-400 font-semibold border-l-4 border-brass-500"
              [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }"
              (click)="onNavItemClick(idx)"
              class="group flex items-center px-3 py-2.5 rounded-lg text-xs font-medium text-stone-600 dark:text-espresso-300 hover:bg-stone-100 dark:hover:bg-espresso-800/60 hover:text-stone-900 dark:hover:text-stone-100 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brass-400"
              [title]="isCollapsed() ? item.label : ''"
              [attr.aria-label]="item.label"
            >
              <svg
                class="w-5 h-5 shrink-0 transition-colors group-hover:text-brass-500 dark:group-hover:text-brass-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="item.iconPath"/>
              </svg>

              @if (!isCollapsed() || isMobileOpen()) {
                <span class="ml-3 truncate flex-1">{{ item.label }}</span>
                @if (item.badge) {
                  <span class="ml-auto px-2 py-0.5 text-[10px] font-semibold rounded-full bg-brass-500/20 text-brass-700 dark:text-brass-400">
                    {{ item.badge }}
                  </span>
                }
              }
            </a>
          }
        </nav>

        <!-- Sidebar Footer Tenant Info -->
        <div class="p-3 border-t border-stone-200 dark:border-espresso-800/80 shrink-0">
          <div class="flex items-center px-2 py-2 rounded-lg bg-stone-100 dark:bg-espresso-900/60 border border-stone-200 dark:border-espresso-800/60">
            <div class="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" title="Tenant Connection Active"></div>
            @if (!isCollapsed() || isMobileOpen()) {
              <div class="ml-2.5 overflow-hidden">
                <p class="text-[11px] font-semibold text-stone-800 dark:text-stone-200 truncate">
                  {{ tenantService.tenantId() ? 'Tenant Active' : 'Default Org' }}
                </p>
                <p class="text-[10px] text-stone-500 dark:text-espresso-400 truncate font-mono">
                  {{ tenantService.tenantId() || '11111111-2222' }}
                </p>
              </div>
            }
          </div>
        </div>
      </aside>

      <!-- Main Layout Body (Topbar + Router Content) -->
      <div class="flex-1 flex flex-col min-w-0 min-h-screen">
        
        <!-- Topbar -->
        <header class="h-16 bg-white dark:bg-espresso-900 border-b border-stone-200 dark:border-espresso-800/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          
          <!-- Left side: Mobile Toggle & Breadcrumbs -->
          <div class="flex items-center space-x-3">
            <button
              (click)="openMobileDrawer()"
              type="button"
              class="md:hidden p-2 rounded-lg text-stone-600 dark:text-espresso-300 hover:bg-stone-100 dark:hover:bg-espresso-800 focus:outline-none focus:ring-2 focus:ring-brass-400"
              aria-label="Open navigation menu"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>

            <!-- Dynamic Breadcrumb Component -->
            <app-breadcrumb></app-breadcrumb>
          </div>

          <!-- Right side: Organization badge, Theme Toggle, User Profile Menu -->
          <div class="flex items-center space-x-3 sm:space-x-4">
            
            <!-- Organization Name Badge -->
            <div class="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-stone-100 dark:bg-espresso-800/80 border border-stone-200 dark:border-espresso-700 text-xs font-medium text-stone-700 dark:text-stone-300">
              <svg class="w-3.5 h-3.5 text-brass-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-6 0h6"/>
              </svg>
              <span>Default Organization</span>
            </div>

            <!-- Light / Dark Theme Toggle Button -->
            <button
              (click)="themeService.toggleTheme()"
              type="button"
              class="p-2 rounded-lg text-stone-600 dark:text-espresso-300 hover:bg-stone-100 dark:hover:bg-espresso-800 focus:outline-none focus:ring-2 focus:ring-brass-400 transition-colors"
              [title]="themeService.theme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
              [attr.aria-label]="'Switch theme'"
            >
              @if (themeService.theme() === 'dark') {
                <!-- Sun Icon -->
                <svg class="w-5 h-5 text-brass-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
              } @else {
                <!-- Moon Icon -->
                <svg class="w-5 h-5 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                </svg>
              }
            </button>

            <!-- User Menu Trigger & Overlay Dropdown -->
            <div class="relative">
              <button
                cdkOverlayOrigin
                #userMenuTrigger="cdkOverlayOrigin"
                (click)="toggleUserMenu()"
                type="button"
                class="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-espresso-800 focus:outline-none focus:ring-2 focus:ring-brass-400 transition-colors"
                [attr.aria-expanded]="isUserMenuOpen()"
                aria-haspopup="true"
                aria-label="User profile menu"
              >
                <div class="w-8 h-8 rounded-full bg-brass-500 text-espresso-950 flex items-center justify-center font-bold text-xs shadow-xs">
                  {{ getUserInitials() }}
                </div>
                <span class="hidden md:inline text-xs font-medium text-stone-800 dark:text-stone-200 truncate max-w-[140px]">
                  {{ authService.currentUser()?.displayName || authService.currentUser()?.email || 'Admin' }}
                </span>
                <svg class="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </button>

              <!-- CDK Overlay Dropdown -->
              <ng-template
                cdkConnectedOverlay
                [cdkConnectedOverlayOrigin]="userMenuTrigger"
                [cdkConnectedOverlayOpen]="isUserMenuOpen()"
                (overlayOutsideClick)="closeUserMenu()"
              >
                <div class="w-56 mt-2 bg-white dark:bg-espresso-900 border border-stone-200 dark:border-espresso-700 rounded-xl shadow-xl py-2 text-xs font-medium text-stone-800 dark:text-stone-200 animate-fade-in z-50">
                  <div class="px-4 py-2.5 border-b border-stone-200 dark:border-espresso-800">
                    <p class="font-semibold text-stone-900 dark:text-stone-100 truncate">
                      {{ authService.currentUser()?.displayName || 'Authenticated User' }}
                    </p>
                    <p class="text-[11px] text-stone-500 dark:text-espresso-400 truncate mt-0.5">
                      {{ authService.currentUser()?.email }}
                    </p>
                  </div>
                  
                  <a
                    routerLink="/users"
                    (click)="closeUserMenu()"
                    class="flex items-center px-4 py-2 hover:bg-stone-100 dark:hover:bg-espresso-800 transition-colors"
                  >
                    <svg class="w-4 h-4 mr-2.5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                    Profile & Settings
                  </a>

                  <button
                    (click)="onLogout()"
                    type="button"
                    class="w-full flex items-center px-4 py-2 text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950/40 transition-colors"
                  >
                    <svg class="w-4 h-4 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                    </svg>
                    Sign Out
                  </button>
                </div>
              </ng-template>
            </div>
          </div>
        </header>

        <main class="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Confirm Sign Out Dialog -->
      <app-confirm-dialog
        [isOpen]="isLogoutConfirmOpen()"
        title="Sign Out"
        message="Sign out of Ledger?"
        confirmText="Sign Out"
        cancelText="Cancel"
        variant="brass"
        (confirm)="confirmLogout()"
        (cancel)="cancelLogout()"
      ></app-confirm-dialog>

      <!-- Global Toast Alerts -->
      <app-toast-container></app-toast-container>

    </div>
  `
})
export class MainLayoutComponent implements AfterViewInit {
  readonly authService = inject(AuthService);
  readonly tenantService = inject(TenantService);
  readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  @ViewChildren(NavItemDirective) navItemDirectives!: QueryList<NavItemDirective>;
  private keyManager?: FocusKeyManager<NavItemDirective>;

  readonly isCollapsed = signal<boolean>(false);
  readonly isMobileOpen = signal<boolean>(false);
  readonly isUserMenuOpen = signal<boolean>(false);
  readonly isLogoutConfirmOpen = signal<boolean>(false);

  readonly navItems: NavItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      iconPath: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z'
    },
    {
      label: 'Users',
      route: '/users',
      iconPath: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
    },
    {
      label: 'Parties',
      route: '/parties',
      iconPath: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-6 0h6'
    },
    {
      label: 'Items & SKU',
      route: '/items',
      iconPath: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
    },
    {
      label: 'Inventory',
      route: '/inventory',
      iconPath: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4'
    },
    {
      label: 'Sales',
      route: '/sales',
      iconPath: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
    },
    {
      label: 'Purchases',
      route: '/purchases',
      iconPath: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z'
    },
    {
      label: 'Payments',
      route: '/payments',
      iconPath: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z'
    },
    {
      label: 'Banking',
      route: '/banking',
      iconPath: 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z'
    },
    {
      label: 'Accounting',
      route: '/accounting',
      iconPath: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
    },
    {
      label: 'Expenses',
      route: '/expenses',
      iconPath: 'M9 14l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    {
      label: 'Reports',
      route: '/reports',
      iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
    },
    {
      label: 'Audit Log',
      route: '/audit',
      iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
    }
  ];

  ngAfterViewInit(): void {
    this.keyManager = new FocusKeyManager(this.navItemDirectives)
      .withWrap()
      .withHomeAndEnd();
  }

  get sidebarClasses(): string {
    const base = 'bg-white dark:bg-espresso-900 border-r border-stone-200 dark:border-espresso-800/80 flex flex-col transition-all duration-300 z-40';
    
    // Desktop layout classes
    const desktopWidth = this.isCollapsed() ? 'md:w-20' : 'md:w-64';

    // Mobile layout classes
    const mobileClasses = this.isMobileOpen()
      ? 'fixed inset-y-0 left-0 w-64 shadow-2xl translate-x-0 md:static md:translate-x-0'
      : 'fixed inset-y-0 left-0 w-64 -translate-x-full md:static md:translate-x-0';

    return `${base} ${desktopWidth} ${mobileClasses}`;
  }

  toggleCollapse(): void {
    this.isCollapsed.set(!this.isCollapsed());
  }

  openMobileDrawer(): void {
    this.isMobileOpen.set(true);
  }

  closeMobileDrawer(): void {
    this.isMobileOpen.set(false);
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen.set(!this.isUserMenuOpen());
  }

  closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }

  onLogout(): void {
    this.closeUserMenu();
    this.isLogoutConfirmOpen.set(true);
  }

  confirmLogout(): void {
    this.isLogoutConfirmOpen.set(false);
    this.authService.logout();
  }

  cancelLogout(): void {
    this.isLogoutConfirmOpen.set(false);
  }

  getUserInitials(): string {
    const user = this.authService.currentUser();
    const name = user?.displayName || user?.email;
    if (!name) return 'A';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // CDK A11y Keyboard navigation for navigation list
  onNavKeydown(event: KeyboardEvent): void {
    if (this.keyManager) {
      this.keyManager.onKeydown(event);
      if (event.key === 'Enter' || event.key === ' ') {
        const activeIdx = this.keyManager.activeItemIndex;
        if (activeIdx !== null && activeIdx !== undefined && this.navItems[activeIdx]) {
          this.router.navigate([this.navItems[activeIdx].route]);
          this.closeMobileDrawer();
        }
      }
    }
  }

  onNavItemClick(index: number): void {
    if (this.keyManager) {
      this.keyManager.setActiveItem(index);
    }
    this.closeMobileDrawer();
  }
}
