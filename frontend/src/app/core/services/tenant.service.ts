import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  readonly tenantId = signal<string | null>(null);

  setTenantId(id: string | null): void {
    this.tenantId.set(id);
  }

  getTenantId(): string | null {
    return this.tenantId();
  }

  clear(): void {
    this.tenantId.set(null);
  }
}
