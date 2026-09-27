import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsersService, User, UserRequest, Role, RoleRequest } from './users.service';
import { ToastService } from '../../core/services/toast.service';
import { DataTableComponent, ColumnDef } from '../../shared/components/data-table/data-table.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { FormDialogComponent } from '../../shared/components/form-dialog/form-dialog.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { PermissionMatrixComponent } from './permission-matrix.component';

export type UserTab = 'users' | 'roles' | 'matrix';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DataTableComponent,
    StatusBadgeComponent,
    ButtonComponent,
    FormDialogComponent,
    ConfirmDialogComponent,
    PermissionMatrixComponent
  ],
  template: `
    <div class="space-y-6">
      
      <!-- Page Header & Tab Controls -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Users & Access Control
          </h1>
          <p class="text-xs sm:text-sm text-stone-500 dark:text-espresso-400 mt-1">
            Manage system user accounts, roles, and granular module permission matrix.
          </p>
        </div>

        <!-- Action Button based on active tab -->
        <div class="flex items-center space-x-3">
          @if (activeTab() === 'users') {
            <app-button variant="brass" size="sm" (click)="openCreateUserModal()">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
              </svg>
              Add New User
            </app-button>
          } @else if (activeTab() === 'roles') {
            <app-button variant="brass" size="sm" (click)="openCreateRoleModal()">
              <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Create New Role
            </app-button>
          }
        </div>
      </div>

      <!-- Main Sub-Navigation Tabs -->
      <div class="border-b border-stone-200 dark:border-espresso-800">
        <nav class="flex space-x-8" aria-label="Users and Roles Tabs">
          <button
            (click)="setTab('users')"
            [class.border-brass-500]="activeTab() === 'users'"
            [class.text-brass-600]="activeTab() === 'users'"
            [class.dark:text-brass-400]="activeTab() === 'users'"
            [class.border-transparent]="activeTab() !== 'users'"
            [class.text-stone-500]="activeTab() !== 'users'"
            class="py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-150 flex items-center space-x-2 focus:outline-none"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
            <span>User Profiles ({{ users().length }})</span>
          </button>

          <button
            (click)="setTab('roles')"
            [class.border-brass-500]="activeTab() === 'roles'"
            [class.text-brass-600]="activeTab() === 'roles'"
            [class.dark:text-brass-400]="activeTab() === 'roles'"
            [class.border-transparent]="activeTab() !== 'roles'"
            [class.text-stone-500]="activeTab() !== 'roles'"
            class="py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-150 flex items-center space-x-2 focus:outline-none"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            <span>System Roles ({{ roles().length }})</span>
          </button>

          <button
            (click)="setTab('matrix')"
            [class.border-brass-500]="activeTab() === 'matrix'"
            [class.text-brass-600]="activeTab() === 'matrix'"
            [class.dark:text-brass-400]="activeTab() === 'matrix'"
            [class.border-transparent]="activeTab() !== 'matrix'"
            [class.text-stone-500]="activeTab() !== 'matrix'"
            class="py-3 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-150 flex items-center space-x-2 focus:outline-none"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
            </svg>
            <span>Permission Matrix</span>
          </button>
        </nav>
      </div>

      <!-- Tab Content Area -->
      
      <!-- TAB 1: User Profiles List -->
      @if (activeTab() === 'users') {
        <div class="space-y-4 animate-fade-in">
          <app-data-table
            [data]="users()"
            [columns]="userTableColumns"
            [loading]="isLoading()"
            emptyTitle="No user profiles"
            emptyMessage="No users found in this organization."
          ></app-data-table>
        </div>
      }

      <!-- TAB 2: Roles List -->
      @if (activeTab() === 'roles') {
        <div class="space-y-4 animate-fade-in">
          <app-data-table
            [data]="roles()"
            [columns]="roleTableColumns"
            [loading]="isLoading()"
            emptyTitle="No roles created"
            emptyMessage="No security roles configured yet."
          ></app-data-table>
        </div>
      }

      <!-- TAB 3: Permission Matrix Grid -->
      @if (activeTab() === 'matrix') {
        <div class="animate-fade-in">
          <app-permission-matrix
            [roles]="roles()"
            (rolesUpdated)="loadData()"
          ></app-permission-matrix>
        </div>
      }

      <!-- User Form Modal -->
      <app-form-dialog
        [isOpen]="isUserModalOpen()"
        [title]="selectedUser() ? 'Edit User Profile' : 'Create New User'"
        [subtitle]="selectedUser() ? 'Update details and assigned security roles' : 'Add a new team member to this tenant organization'"
        [submitText]="selectedUser() ? 'Update User' : 'Create User'"
        [loading]="isSubmitting()"
        [submitDisabled]="userForm.invalid"
        (formSubmit)="saveUser()"
        (cancel)="closeUserModal()"
      >
        <form [formGroup]="userForm" class="space-y-4 text-xs">
          <!-- Email -->
          <div>
            <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
              Email Address <span class="text-rose-500">*</span>
            </label>
            <input
              type="email"
              formControlName="email"
              placeholder="e.g. alex.smith@company.com"
              class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
            />
          </div>

          <!-- Password (Only required on creation) -->
          @if (!selectedUser()) {
            <div>
              <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
                Temporary Password <span class="text-rose-500">*</span>
              </label>
              <input
                type="password"
                formControlName="password"
                placeholder="At least 6 characters"
                class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
              />
            </div>
          }

          <!-- First & Last Name -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
                First Name
              </label>
              <input
                type="text"
                formControlName="firstName"
                placeholder="Alex"
                class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
              />
            </div>
            <div>
              <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
                Last Name
              </label>
              <input
                type="text"
                formControlName="lastName"
                placeholder="Smith"
                class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
              />
            </div>
          </div>

          <!-- Assigned Roles -->
          <div>
            <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1.5 uppercase text-[11px]">
              Assigned Roles
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-stone-50 dark:bg-espresso-950 rounded-lg border border-stone-200 dark:border-espresso-800">
              @for (role of roles(); track role.id) {
                <label class="flex items-center space-x-2 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    [value]="role.id"
                    [checked]="isRoleSelectedForUser(role.id)"
                    (change)="toggleUserRoleSelection(role.id)"
                    class="w-4 h-4 rounded text-brass-500 focus:ring-brass-400 accent-brass-500"
                  />
                  <span class="font-medium text-stone-800 dark:text-stone-200">{{ role.name }}</span>
                </label>
              }
            </div>
          </div>
        </form>
      </app-form-dialog>

      <!-- Role Form Modal -->
      <app-form-dialog
        [isOpen]="isRoleModalOpen()"
        [title]="selectedRole() ? 'Edit Role Metadata' : 'Create New Role'"
        [subtitle]="selectedRole() ? 'Modify role title and description' : 'Define a new security role for permissions assignment'"
        [submitText]="selectedRole() ? 'Update Role' : 'Create Role'"
        [loading]="isSubmitting()"
        [submitDisabled]="roleForm.invalid"
        (formSubmit)="saveRole()"
        (cancel)="closeRoleModal()"
      >
        <form [formGroup]="roleForm" class="space-y-4 text-xs">
          <div>
            <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
              Role Name <span class="text-rose-500">*</span>
            </label>
            <input
              type="text"
              formControlName="name"
              placeholder="e.g. INVENTORY_MANAGER"
              class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brass-400"
            />
          </div>

          <div>
            <label class="block font-medium text-stone-700 dark:text-stone-300 mb-1 uppercase text-[11px]">
              Role Description
            </label>
            <textarea
              formControlName="description"
              rows="3"
              placeholder="Brief summary of duties and responsibilities..."
              class="w-full bg-stone-50 dark:bg-espresso-950 border border-stone-200 dark:border-espresso-700 rounded-lg px-3 py-2 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-brass-400"
            ></textarea>
          </div>
        </form>
      </app-form-dialog>

      <!-- Confirm Delete Modal -->
      <app-confirm-dialog
        [isOpen]="isDeleteModalOpen()"
        [title]="deleteTargetType === 'user' ? 'Delete User Profile?' : 'Delete System Role?'"
        [message]="deleteTargetType === 'user'
          ? 'Are you sure you want to permanently delete ' + (itemToDelete?.email || 'this user') + '?'
          : 'Are you sure you want to delete role ' + (itemToDelete?.name || '') + '?'"
        variant="danger"
        confirmText="Delete"
        [loading]="isSubmitting()"
        (confirm)="confirmDelete()"
        (cancel)="closeDeleteModal()"
      ></app-confirm-dialog>

    </div>
  `
})
export class UsersComponent implements OnInit {
  readonly usersService = inject(UsersService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly activeTab = signal<UserTab>('users');
  readonly users = signal<User[]>([]);
  readonly roles = signal<Role[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly isSubmitting = signal<boolean>(false);

  // Modals state
  readonly isUserModalOpen = signal<boolean>(false);
  readonly isRoleModalOpen = signal<boolean>(false);
  readonly isDeleteModalOpen = signal<boolean>(false);

  readonly selectedUser = signal<User | null>(null);
  readonly selectedRole = signal<Role | null>(null);
  
  deleteTargetType: 'user' | 'role' = 'user';
  itemToDelete: any = null;

  selectedUserRoleIds: string[] = [];

  userForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    firstName: [''],
    lastName: ['']
  });

  roleForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    description: ['']
  });

  // User Table Columns
  userTableColumns: ColumnDef<User>[] = [
    { key: 'email', header: 'Email Address', width: '220px' },
    {
      key: 'name',
      header: 'Full Name',
      cell: (user) => `${user.firstName || ''} ${user.lastName || ''}`.trim() || '—'
    },
    {
      key: 'roles',
      header: 'Assigned Roles',
      cell: (user) => user.roleNames.join(', ') || 'No Roles'
    },
    {
      key: 'active',
      header: 'Status',
      align: 'center',
      width: '100px',
      cell: (user) => user.active ? 'ACTIVE' : 'INACTIVE'
    },
    {
      key: 'createdAt',
      header: 'Created Date',
      width: '140px',
      cell: (user) => user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'
    }
  ];

  // Role Table Columns
  roleTableColumns: ColumnDef<Role>[] = [
    { key: 'name', header: 'Role Name', width: '200px' },
    { key: 'description', header: 'Description' },
    {
      key: 'permissions',
      header: 'Granted Permissions',
      align: 'center',
      width: '160px',
      cell: (role) => `${role.permissionCodes.length} codes`
    }
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    
    this.usersService.getRoles().subscribe({
      next: (roles) => {
        this.roles.set(roles);
        
        this.usersService.getUsers().subscribe({
          next: (users) => {
            this.users.set(users);
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false)
        });
      },
      error: () => this.isLoading.set(false)
    });
  }

  setTab(tab: UserTab): void {
    this.activeTab.set(tab);
  }

  // User Modal Logic
  openCreateUserModal(): void {
    this.selectedUser.set(null);
    this.selectedUserRoleIds = [];
    this.userForm.reset();
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.isUserModalOpen.set(true);
  }

  openEditUserModal(user: User): void {
    this.selectedUser.set(user);
    this.userForm.patchValue({
      email: user.email,
      firstName: user.firstName || '',
      lastName: user.lastName || ''
    });
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();

    this.selectedUserRoleIds = this.roles()
      .filter(r => user.roleNames.includes(r.name))
      .map(r => r.id);

    this.isUserModalOpen.set(true);
  }

  closeUserModal(): void {
    this.isUserModalOpen.set(false);
  }

  isRoleSelectedForUser(roleId: string): boolean {
    return this.selectedUserRoleIds.includes(roleId);
  }

  toggleUserRoleSelection(roleId: string): void {
    if (this.selectedUserRoleIds.includes(roleId)) {
      this.selectedUserRoleIds = this.selectedUserRoleIds.filter(id => id !== roleId);
    } else {
      this.selectedUserRoleIds.push(roleId);
    }
  }

  saveUser(): void {
    if (this.userForm.invalid) return;

    this.isSubmitting.set(true);
    const req: UserRequest = {
      ...this.userForm.value,
      roleIds: this.selectedUserRoleIds
    };

    const user = this.selectedUser();
    if (user) {
      this.usersService.updateUser(user.id, req).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeUserModal();
          this.toast.success('User updated successfully', 'Success');
          this.loadData();
        },
        error: () => this.isSubmitting.set(false)
      });
    } else {
      this.usersService.createUser(req).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeUserModal();
          this.toast.success('User profile created successfully', 'Success');
          this.loadData();
        },
        error: () => this.isSubmitting.set(false)
      });
    }
  }

  // Role Modal Logic
  openCreateRoleModal(): void {
    this.selectedRole.set(null);
    this.roleForm.reset();
    this.isRoleModalOpen.set(true);
  }

  openEditRoleModal(role: Role): void {
    this.selectedRole.set(role);
    this.roleForm.patchValue({
      name: role.name,
      description: role.description || ''
    });
    this.isRoleModalOpen.set(true);
  }

  closeRoleModal(): void {
    this.isRoleModalOpen.set(false);
  }

  saveRole(): void {
    if (this.roleForm.invalid) return;

    this.isSubmitting.set(true);
    const req: RoleRequest = {
      ...this.roleForm.value
    };

    const role = this.selectedRole();
    if (role) {
      this.usersService.updateRole(role.id, req).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeRoleModal();
          this.toast.success('Role updated successfully', 'Success');
          this.loadData();
        },
        error: () => this.isSubmitting.set(false)
      });
    } else {
      this.usersService.createRole(req).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeRoleModal();
          this.toast.success('New role created successfully', 'Success');
          this.loadData();
        },
        error: () => this.isSubmitting.set(false)
      });
    }
  }

  // Delete Modal Logic
  openDeleteModal(type: 'user' | 'role', item: any): void {
    this.deleteTargetType = type;
    this.itemToDelete = item;
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.isDeleteModalOpen.set(false);
  }

  confirmDelete(): void {
    if (!this.itemToDelete) return;
    this.isSubmitting.set(true);

    if (this.deleteTargetType === 'user') {
      this.usersService.deleteUser(this.itemToDelete.id).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeDeleteModal();
          this.toast.success('User deleted successfully', 'Success');
          this.loadData();
        },
        error: () => this.isSubmitting.set(false)
      });
    } else {
      this.usersService.deleteRole(this.itemToDelete.id).subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closeDeleteModal();
          this.toast.success('Role deleted successfully', 'Success');
          this.loadData();
        },
        error: () => this.isSubmitting.set(false)
      });
    }
  }
}
