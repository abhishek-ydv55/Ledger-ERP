package com.company.erp.modules.parties.dto;

import com.company.erp.modules.parties.entity.PartyRole;
import jakarta.validation.constraints.NotBlank;

import java.util.List;
import java.util.Set;

public record PartyRequest(
        @NotBlank(message = "Party name is required")
        String name,
        String code,
        String email,
        String phone,
        String taxId,
        Boolean active,
        Set<PartyRole> roles,
        List<PartyContactRequest> contacts,
        List<PartyAddressRequest> addresses
) {
}
