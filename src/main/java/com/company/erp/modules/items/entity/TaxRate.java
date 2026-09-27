package com.company.erp.modules.items.entity;

import com.company.erp.common.domain.TenantScopedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "tax_rates")
public class TaxRate extends TenantScopedEntity {

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "rate", nullable = false)
    private BigDecimal rate;

    @Column(name = "code")
    private String code;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    public TaxRate() {
    }

    public TaxRate(String name, BigDecimal rate, String code, boolean active) {
        this.name = name;
        this.rate = rate;
        this.code = code;
        this.active = active;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BigDecimal getRate() {
        return rate;
    }

    public void setRate(BigDecimal rate) {
        this.rate = rate;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
