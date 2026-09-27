package com.company.erp.modules.inventory.entity;

import com.company.erp.common.domain.TenantScopedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "warehouses")
public class Warehouse extends TenantScopedEntity {

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "code", nullable = false)
    private String code;

    @Column(name = "location")
    private String location;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    public Warehouse() {
    }

    public Warehouse(String name, String code, String location, boolean active) {
        this.name = name;
        this.code = code;
        this.location = location;
        this.active = active;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
