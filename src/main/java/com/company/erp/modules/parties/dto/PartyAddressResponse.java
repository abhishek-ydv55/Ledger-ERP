package com.company.erp.modules.parties.dto;

import java.time.Instant;
import java.util.UUID;

public record PartyAddressResponse(
        UUID id,
        String addressType,
        String addressLine1,
        String addressLine2,
        String city,
        String state,
        String postalCode,
        String country,
        boolean isPrimary,
        Instant createdAt,
        Instant updatedAt
) {
}
