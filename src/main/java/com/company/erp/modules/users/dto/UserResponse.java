package com.company.erp.modules.users.dto;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record UserResponse(
        UUID id,
        UUID organizationId,
        String email,
        String firstName,
        String lastName,
        boolean active,
        Set<String> roleNames,
        Instant createdAt,
        Instant updatedAt
) {
}
