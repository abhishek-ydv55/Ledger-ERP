package com.company.erp.modules.parties.dto;

import com.company.erp.modules.parties.entity.PartyRole;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public record PartyResponse(
        UUID id,
        UUID organizationId,
        String name,
        String code,
        String email,
        String phone,
        String taxId,
        boolean active,
        Set<PartyRole> roles,
        List<PartyContactResponse> contacts,
        List<PartyAddressResponse> addresses,
        Instant createdAt,
        Instant updatedAt
) {
}
