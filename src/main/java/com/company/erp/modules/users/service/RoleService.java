package com.company.erp.modules.users.service;

import com.company.erp.modules.users.dto.RoleRequest;
import com.company.erp.modules.users.dto.RoleResponse;

import java.util.List;
import java.util.UUID;

public interface RoleService {

    RoleResponse createRole(RoleRequest request);

    RoleResponse getRoleById(UUID id);

    List<RoleResponse> getAllRoles();

    RoleResponse updateRole(UUID id, RoleRequest request);

    void deleteRole(UUID id);
}
