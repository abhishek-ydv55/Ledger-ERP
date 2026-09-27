package com.company.erp.modules.audit.dto;

import java.time.Instant;
import java.util.UUID;

public record AuditLogResponse(
        UUID id,
        UUID organizationId,
        String entityType,
        UUID entityId,
        String action,
        String oldSnapshot,
        String newSnapshot,
        UUID actorId,
        Instant createdAt,
        Instant updatedAt
) {
}
