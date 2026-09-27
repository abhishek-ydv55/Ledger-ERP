import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersService, Role } from './users.service';
import { ToastService } from '../../core/services/toast.service';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-permission-matrix',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <div class="space-y-6 w-full">
      
      <!-- Top Action & Filter Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-espresso-900 p-4 rounded-xl border border-stone-200 dark:border-espresso-800 shadow-xs">
        <div>
          <h3 class="text-sm font-semibold text-stone-900 dark:text-stone-100 flex items-center space-x-2">
            <span>Role & Permission Authorization Matrix</span>
            @if (dirtyRoleIds().size > 0) {
              <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 animate-pulse">
                {{ dirtyRoleIds().size }} role(s) modified
              </span>
            }
          </h3>
          <p class="text-xs text-stone-500 dark:text-espresso-400 mt-0.5">
            Directly configure the <code class="px-1 py-0.5 rounded bg-stone-100 dark:bg-espresso-800 font-mono text-[11px]">role_permissions</code> join table mapping by module and action codes.
          </p>
        </div>

        <div class="flex items-center space-x-3">
          <!-- Module Filter Dropdown -->
          <div class="flex items-center space-x-1.5 text-xs text-stone-600 dark:text-espresso-300">
            <span>Module Filter:</span>
            <select
              [value]="selectedModuleFilter()"
              (change)="onModuleFilterChange($event)"
              class="bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
            >
              <option value="ALL">All System Modules (12)</option>
              @for (mod of usersService.systemModules; track mod.key) {
                <option [value]="mod.key">{{ mod.label }}</option>
              }
            </select>
          </div>

          <!-- Save Button -->
          <app-button
            variant="brass"
            size="sm"
            [disabled]="dirtyRoleIds().size === 0 || isSaving()"
            [loading]="isSaving()"
            (click)="saveMatrix()"
          >
            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Save Matrix Changes
          </app-button>
        </div>
      </div>

      <!-- Matrix Table Container -->
      <div class="w-full overflow-x-auto rounded-xl border border-stone-200 dark:border-espresso-800 bg-white dark:bg-espresso-900 shadow-xs max-h-[70vh] overflow-y-auto">
        <table class="w-full border-collapse text-left text-xs">
          
          <!-- Sticky Grouped Header Rows -->
          <thead class="sticky top-0 z-20 bg-stone-100 dark:bg-espresso-950 border-b border-stone-200 dark:border-espresso-800 shadow-xs select-none">
            
            <!-- Tier 1 Header: Module Group Titles -->
            <tr class="text-[10px] font-bold text-stone-500 dark:text-espresso-400 uppercase tracking-wider">
              <th class="sticky left-0 z-30 bg-stone-100 dark:bg-espresso-950 px-4 py-3 border-r border-stone-200 dark:border-espresso-800 min-w-[220px]">
                Roles / Permission Matrix
              </th>

              @for (mod of filteredModules; track mod.key) {
                <th
                  [attr.colspan]="actions.length"
                  class="px-3 py-2 text-center border-r border-stone-200 dark:border-espresso-800 bg-stone-200/50 dark:bg-espresso-900/80 text-stone-700 dark:text-stone-300 font-serif"
                >
                  {{ mod.label }}
                </th>
              }
            </tr>

            <!-- Tier 2 Header: Action Permission Codes (READ, CREATE, UPDATE, DELETE, APPROVE) -->
            <tr class="text-[10px] font-semibold text-stone-500 dark:text-espresso-400 uppercase tracking-wider">
              <th class="sticky left-0 z-30 bg-stone-100 dark:bg-espresso-950 px-4 py-2 border-r border-stone-200 dark:border-espresso-800">
                Action Codes
              </th>

              @for (mod of filteredModules; track mod.key) {
                @for (act of actions; track act) {
                  <th
                    [class.border-r]="$last"
                    class="px-2 py-2 text-center w-16 border-stone-200 dark:border-espresso-800 font-mono text-[9px] text-stone-600 dark:text-espresso-300"
                  >
                    {{ act }}
                  </th>
                }
              }
            </tr>
          </thead>

          <!-- Table Body: Role Rows -->
          <tbody class="divide-y divide-stone-200 dark:divide-espresso-800/60 text-stone-800 dark:text-stone-200">
            @for (role of roles; track role.id) {
              <tr class="hover:bg-stone-50/60 dark:hover:bg-espresso-800/30 transition-colors group">
                
                <!-- Role Info Sticky Left Header Column -->
                <td class="sticky left-0 z-10 bg-white dark:bg-espresso-900 group-hover:bg-stone-50 dark:group-hover:bg-espresso-800/60 px-4 py-3 border-r border-stone-200 dark:border-espresso-800 min-w-[220px]">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="font-bold font-mono text-xs text-stone-900 dark:text-stone-100">
                        {{ role.name }}
                      </span>
                      @if (role.description) {
                        <p class="text-[10px] text-stone-500 dark:text-espresso-400 line-clamp-1 mt-0.5">
                          {{ role.description }}
                        </p>
                      }
                    </div>

                    <!-- Row Select All Shortcut Toggle -->
                    <button
                      (click)="toggleAllForRole(role)"
                      type="button"
                      class="ml-2 px-1.5 py-0.5 rounded text-[9px] font-semibold text-stone-500 hover:text-brass-600 dark:hover:text-brass-400 bg-stone-100 dark:bg-espresso-800 hover:bg-brass-500/10 transition-colors"
                      title="Toggle all permissions for this role"
                    >
                      All
                    </button>
                  </div>
                </td>

                <!-- Checkbox Cells Matrix -->
                @for (mod of filteredModules; track mod.key) {
                  @for (act of actions; track act) {
                    <td
                      [class.border-r]="$last"
                      [ngClass]="{ 'bg-brass-500/10': isPermissionChecked(role.id, mod.key, act) }"
                      class="px-2 py-3 text-center border-stone-200 dark:border-espresso-800/60 transition-colors"
                    >
                      <input
                        type="checkbox"
                        [checked]="isPermissionChecked(role.id, mod.key, act)"
                        (change)="togglePermission(role.id, mod.key, act)"
                        class="w-4 h-4 rounded text-brass-500 bg-stone-50 dark:bg-espresso-950 border-stone-300 dark:border-espresso-700 focus:ring-brass-400 focus:ring-2 focus:ring-offset-0 cursor-pointer accent-brass-500"
                      />
                    </td>
                  }
                }

              </tr>
            }
          </tbody>

        </table>
      </div>

    </div>
  `
})
export class PermissionMatrixComponent implements OnInit {
  readonly usersService = inject(UsersService);
  private readonly toast = inject(ToastService);

  @Input() roles: Role[] = [];
  @Output() rolesUpdated = new EventEmitter<void>();

  readonly selectedModuleFilter = signal<string>('ALL');
  readonly isSaving = signal<boolean>(false);
  readonly dirtyRoleIds = signal<Set<string>>(new Set());

  // Matrix internal state map: roleId -> Set<permissionCode>
  rolePermissionsMap = new Map<string, Set<string>>();

  readonly actions: ('READ' | 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE')[] = [
    'READ', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE'
  ];

  ngOnInit(): void {
    this.initMatrixMap();
  }

  initMatrixMap(): void {
    this.rolePermissionsMap.clear();
    for (const role of this.roles) {
      this.rolePermissionsMap.set(role.id, new Set(role.permissionCodes || []));
    }
    this.dirtyRoleIds.set(new Set());
  }

  get filteredModules() {
    const filter = this.selectedModuleFilter();
    if (filter === 'ALL') {
      return this.usersService.systemModules;
    }
    return this.usersService.systemModules.filter(m => m.key === filter);
  }

  isPermissionChecked(roleId: string, modKey: string, act: string): boolean {
    const code = `${modKey}_${act}`;
    const set = this.rolePermissionsMap.get(roleId);
    return set ? set.has(code) : false;
  }

  togglePermission(roleId: string, modKey: string, act: string): void {
    const code = `${modKey}_${act}`;
    const set = this.rolePermissionsMap.get(roleId);
    if (!set) return;

    if (set.has(code)) {
      set.delete(code);
    } else {
      set.add(code);
    }

    this.markDirty(roleId);
  }

  toggleAllForRole(role: Role): void {
    const set = this.rolePermissionsMap.get(role.id);
    if (!set) return;

    const visibleCodes: string[] = [];
    for (const mod of this.filteredModules) {
      for (const act of this.actions) {
        visibleCodes.push(`${mod.key}_${act}`);
      }
    }

    const allChecked = visibleCodes.every(c => set.has(c));
    if (allChecked) {
      visibleCodes.forEach(c => set.delete(c));
    } else {
      visibleCodes.forEach(c => set.add(c));
    }

    this.markDirty(role.id);
  }

  onModuleFilterChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedModuleFilter.set(val);
  }

  saveMatrix(): void {
    const dirtyIds = Array.from(this.dirtyRoleIds());
    if (dirtyIds.length === 0) return;

    this.isSaving.set(true);
    let completedCount = 0;

    for (const roleId of dirtyIds) {
      const set = this.rolePermissionsMap.get(roleId);
      const permCodes = Array.from(set || []);

      this.usersService.saveRolePermissions(roleId, permCodes).subscribe({
        next: () => {
          completedCount++;
          if (completedCount === dirtyIds.length) {
            this.isSaving.set(false);
            this.dirtyRoleIds.set(new Set());
            this.toast.success('Role permissions matrix updated successfully', 'Permissions Saved');
            this.rolesUpdated.emit();
          }
        },
        error: () => {
          this.isSaving.set(false);
          this.toast.error('Failed to save some role permissions', 'Error');
        }
      });
    }
  }

  private markDirty(roleId: string): void {
    const current = new Set(this.dirtyRoleIds());
    current.add(roleId);
    this.dirtyRoleIds.set(current);
  }
}
