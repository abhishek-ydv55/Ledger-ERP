package com.company.erp.common.domain;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

import java.util.UUID;

@MappedSuperclass
@FilterDef(
    name = TenantScopedEntity.TENANT_FILTER_NAME,
    parameters = @ParamDef(name = TenantScopedEntity.TENANT_PARAM_NAME, type = UUID.class)
)
@Filter(
    name = TenantScopedEntity.TENANT_FILTER_NAME,
    condition = "organization_id = :" + TenantScopedEntity.TENANT_PARAM_NAME
)
public abstract class TenantScopedEntity extends BaseEntity {

    public static final String TENANT_FILTER_NAME = "tenantFilter";
    public static final String TENANT_PARAM_NAME = "tenantId";

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    public UUID getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(UUID organizationId) {
        this.organizationId = organizationId;
    }
}
