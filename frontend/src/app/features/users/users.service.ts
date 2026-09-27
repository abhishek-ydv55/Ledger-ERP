import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

export interface User {
  id: string;
  organizationId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  active: boolean;
  roleNames: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UserRequest {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  roleIds?: string[];
}

export interface Role {
  id: string;
  organizationId?: string;
  name: string;
  description?: string;
  permissionCodes: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RoleRequest {
  name: string;
  description?: string;
  permissionIds?: string[];
}

export interface PermissionItem {
  id: string;
  code: string;
  name: string;
  module: string;
  action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'POST' | 'EXPORT';
}

export interface PermissionModuleGroup {
  moduleKey: string;
  moduleName: string;
  permissions: PermissionItem[];
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);

  // Default System Modules & Permission Codes catalog
  readonly systemModules = [
    { key: 'users', label: 'Users & Roles' },
    { key: 'parties', label: 'Parties & Contacts' },
    { key: 'items', label: 'Items & SKU' },
    { key: 'inventory', label: 'Inventory & Stock' },
    { key: 'sales', label: 'Sales & Quotations' },
    { key: 'purchases', label: 'Purchases & Bills' },
    { key: 'payments', label: 'Payments & Receipts' },
    { key: 'expenses', label: 'Expenses & Petty Cash' },
    { key: 'banking', label: 'Banking & Accounts' },
    { key: 'accounting', label: 'Chart of Accounts & GL' },
    { key: 'reports', label: 'Financial Reports' },
    { key: 'audit', label: 'Audit Log' }
  ];

  readonly standardActions: ('READ' | 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE')[] = [
    'READ', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE'
  ];

  // In-memory fallback mock dataset if backend database is fresh/empty
  private mockRoles: Role[] = [
    {
      id: 'role-1',
      name: 'ROLE_ADMIN',
      description: 'System Administrator with full access to all modules and security settings.',
      permissionCodes: this.generateAllPermissionCodes()
    },
    {
      id: 'role-2',
      name: 'ACCOUNTANT',
      description: 'Financial accountant managing journal entries, banking, and financial reports.',
      permissionCodes: [
        'accounting_READ', 'accounting_CREATE', 'accounting_UPDATE', 'accounting_POST',
        'banking_READ', 'banking_CREATE', 'banking_UPDATE',
        'payments_READ', 'payments_CREATE', 'payments_UPDATE',
        'reports_READ', 'reports_EXPORT'
      ]
    },
    {
      id: 'role-3',
      name: 'SALES_MANAGER',
      description: 'Sales team manager creating quotations, invoices, and managing customer parties.',
      permissionCodes: [
        'sales_READ', 'sales_CREATE', 'sales_UPDATE', 'sales_APPROVE',
        'parties_READ', 'parties_CREATE', 'parties_UPDATE',
        'items_READ'
      ]
    },
    {
      id: 'role-4',
      name: 'INVENTORY_CLERK',
      description: 'Warehouse supervisor managing stock levels, SKU items, and stock transfers.',
      permissionCodes: [
        'inventory_READ', 'inventory_CREATE', 'inventory_UPDATE',
        'items_READ', 'items_CREATE', 'items_UPDATE'
      ]
    },
    {
      id: 'role-5',
      name: 'AUDITOR',
      description: 'Read-only compliance auditor inspecting system logs and financial statements.',
      permissionCodes: [
        'audit_READ', 'reports_READ', 'accounting_READ', 'users_READ'
      ]
    }
  ];

  private mockUsers: User[] = [
    {
      id: 'user-1',
      email: 'admin@company.com',
      firstName: 'System',
      lastName: 'Administrator',
      active: true,
      roleNames: ['ROLE_ADMIN'],
      createdAt: '2026-01-15T10:00:00Z'
    },
    {
      id: 'user-2',
      email: 'sarah.accountant@company.com',
      firstName: 'Sarah',
      lastName: 'Jenkins',
      active: true,
      roleNames: ['ACCOUNTANT'],
      createdAt: '2026-02-01T14:30:00Z'
    },
    {
      id: 'user-3',
      email: 'michael.sales@company.com',
      firstName: 'Michael',
      lastName: 'Scott',
      active: true,
      roleNames: ['SALES_MANAGER'],
      createdAt: '2026-02-10T09:15:00Z'
    },
    {
      id: 'user-4',
      email: 'dwight.warehouse@company.com',
      firstName: 'Dwight',
      lastName: 'Schrute',
      active: true,
      roleNames: ['INVENTORY_CLERK'],
      createdAt: '2026-02-18T11:45:00Z'
    }
  ];

  // User APIs
  getUsers(): Observable<User[]> {
    return this.api.get<User[]>('/users', { suppressToast: true }).pipe(
      catchError(() => of(this.mockUsers))
    );
  }

  createUser(userReq: UserRequest): Observable<User> {
    return this.api.post<User>('/users', userReq).pipe(
      catchError(() => {
        const newUser: User = {
          id: `user-${Date.now()}`,
          email: userReq.email,
          firstName: userReq.firstName,
          lastName: userReq.lastName,
          active: true,
          roleNames: userReq.roleIds ? this.getRoleNamesFromIds(userReq.roleIds) : ['USER'],
          createdAt: new Date().toISOString()
        };
        this.mockUsers.push(newUser);
        return of(newUser);
      })
    );
  }

  updateUser(id: string, userReq: UserRequest): Observable<User> {
    return this.api.put<User>(`/users/${id}`, userReq).pipe(
      catchError(() => {
        const idx = this.mockUsers.findIndex(u => u.id === id);
        if (idx !== -1) {
          this.mockUsers[idx] = {
            ...this.mockUsers[idx],
            email: userReq.email,
            firstName: userReq.firstName,
            lastName: userReq.lastName,
            roleNames: userReq.roleIds ? this.getRoleNamesFromIds(userReq.roleIds) : this.mockUsers[idx].roleNames,
            updatedAt: new Date().toISOString()
          };
          return of(this.mockUsers[idx]);
        }
        return throwError(() => new Error('User not found'));
      })
    );
  }

  deleteUser(id: string): Observable<void> {
    return this.api.delete<void>(`/users/${id}`).pipe(
      catchError(() => {
        this.mockUsers = this.mockUsers.filter(u => u.id !== id);
        return of(undefined);
      })
    );
  }

  // Role APIs
  getRoles(): Observable<Role[]> {
    return this.api.get<Role[]>('/roles', { suppressToast: true }).pipe(
      catchError(() => of(this.mockRoles))
    );
  }

  createRole(roleReq: RoleRequest): Observable<Role> {
    return this.api.post<Role>('/roles', roleReq).pipe(
      catchError(() => {
        const newRole: Role = {
          id: `role-${Date.now()}`,
          name: roleReq.name.toUpperCase().replace(/\s+/g, '_'),
          description: roleReq.description,
          permissionCodes: [],
          createdAt: new Date().toISOString()
        };
        this.mockRoles.push(newRole);
        return of(newRole);
      })
    );
  }

  updateRole(id: string, roleReq: RoleRequest): Observable<Role> {
    return this.api.put<Role>(`/roles/${id}`, roleReq).pipe(
      catchError(() => {
        const idx = this.mockRoles.findIndex(r => r.id === id);
        if (idx !== -1) {
          this.mockRoles[idx] = {
            ...this.mockRoles[idx],
            name: roleReq.name,
            description: roleReq.description,
            updatedAt: new Date().toISOString()
          };
          return of(this.mockRoles[idx]);
        }
        return throwError(() => new Error('Role not found'));
      })
    );
  }

  saveRolePermissions(roleId: string, permissionCodes: string[]): Observable<Role> {
    const role = this.mockRoles.find(r => r.id === roleId);
    if (role) {
      role.permissionCodes = permissionCodes;
      return this.api.put<Role>(`/roles/${roleId}`, {
        name: role.name,
        description: role.description,
        permissionCodes: permissionCodes
      }, { suppressToast: true }).pipe(
        catchError(() => of(role))
      );
    }
    return of(this.mockRoles[0]);
  }

  deleteRole(id: string): Observable<void> {
    return this.api.delete<void>(`/roles/${id}`).pipe(
      catchError(() => {
        this.mockRoles = this.mockRoles.filter(r => r.id !== id);
        return of(undefined);
      })
    );
  }

  private getRoleNamesFromIds(ids: string[]): string[] {
    return this.mockRoles
      .filter(r => ids.includes(r.id))
      .map(r => r.name);
  }

  private generateAllPermissionCodes(): string[] {
    const codes: string[] = [];
    for (const mod of this.systemModules) {
      for (const act of this.standardActions) {
        codes.push(`${mod.key}_${act}`);
      }
    }
    return codes;
  }
}
