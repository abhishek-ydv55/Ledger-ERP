package com.company.erp.common.context;

import java.util.UUID;

public final class TenantContext {

    private TenantContext() {
    }

    public static UUID getTenantId() {
        return com.company.erp.common.tenant.TenantContext.getTenantId();
    }

    public static void setTenantId(UUID tenantId) {
        com.company.erp.common.tenant.TenantContext.setTenantId(tenantId);
    }

    public static void clear() {
        com.company.erp.common.tenant.TenantContext.clear();
    }
}
