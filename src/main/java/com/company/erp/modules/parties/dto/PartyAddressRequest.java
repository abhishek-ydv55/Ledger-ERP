package com.company.erp.modules.parties.dto;

import jakarta.validation.constraints.NotBlank;

public record PartyAddressRequest(
        @NotBlank(message = "Address type is required")
        String addressType,
        @NotBlank(message = "Address line 1 is required")
        String addressLine1,
        String addressLine2,
        String city,
        String state,
        String postalCode,
        String country,
        Boolean isPrimary
) {
}
