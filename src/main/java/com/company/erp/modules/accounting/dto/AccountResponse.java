package com.company.erp.modules.accounting.dto;

import com.company.erp.modules.accounting.entity.AccountType;

import java.time.Instant;
import java.util.UUID;

public record AccountResponse(
        UUID id,
        UUID organizationId,
        String code,
        String name,
        AccountType accountType,
        UUID parentId,
        String parentCode,
        String parentName,
        boolean active,
        boolean header,
        Instant createdAt,
        Instant updatedAt
) {
}
