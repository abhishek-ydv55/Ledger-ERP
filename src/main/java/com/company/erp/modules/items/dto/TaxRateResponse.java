package com.company.erp.modules.items.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TaxRateResponse(
        UUID id,
        UUID organizationId,
        String name,
        BigDecimal rate,
        String code,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
}
