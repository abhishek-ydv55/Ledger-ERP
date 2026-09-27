package com.company.erp.modules.parties.dto;

import java.time.Instant;
import java.util.UUID;

public record PartyContactResponse(
        UUID id,
        String name,
        String email,
        String phone,
        String designation,
        boolean isPrimary,
        Instant createdAt,
        Instant updatedAt
) {
}
