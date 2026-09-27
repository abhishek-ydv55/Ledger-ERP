package com.company.erp.modules.users.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.Set;
import java.util.UUID;

public record RoleRequest(
        @NotBlank(message = "Role name is required")
        String name,
        String description,
        Set<UUID> permissionIds
) {
}
