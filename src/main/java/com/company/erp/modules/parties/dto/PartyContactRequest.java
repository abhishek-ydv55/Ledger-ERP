package com.company.erp.modules.parties.dto;

import jakarta.validation.constraints.NotBlank;

public record PartyContactRequest(
        @NotBlank(message = "Contact name is required")
        String name,
        String email,
        String phone,
        String designation,
        Boolean isPrimary
) {
}
