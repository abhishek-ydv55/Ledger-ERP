package com.company.erp.modules.users.dto;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record RoleResponse(
        UUID id,
        UUID organizationId,
        String name,
        String description,
        Set<String> permissionCodes,
        Instant createdAt,
        Instant updatedAt
) {
}
