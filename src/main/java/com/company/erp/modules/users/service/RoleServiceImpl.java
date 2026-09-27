package com.company.erp.modules.users.service;

import com.company.erp.common.tenant.TenantContext;
import com.company.erp.common.exception.ResourceNotFoundException;
import com.company.erp.modules.users.dto.RoleRequest;
import com.company.erp.modules.users.dto.RoleResponse;
import com.company.erp.modules.users.entity.Permission;
import com.company.erp.modules.users.entity.Role;
import com.company.erp.modules.users.repository.PermissionRepository;
import com.company.erp.modules.users.repository.RoleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class RoleServiceImpl implements RoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    public RoleServiceImpl(RoleRepository roleRepository, PermissionRepository permissionRepository) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
    }

    @Override
    @Transactional
    public RoleResponse createRole(RoleRequest request) {
        Role role = new Role(request.name(), request.description());
        if (TenantContext.getTenantId() != null) {
            role.setOrganizationId(TenantContext.getTenantId());
        }

        if (request.permissionIds() != null && !request.permissionIds().isEmpty()) {
            Set<Permission> permissions = new HashSet<>(permissionRepository.findAllById(request.permissionIds()));
            role.setPermissions(permissions);
        }

        Role savedRole = roleRepository.save(role);
        return mapToResponse(savedRole);
    }

    @Override
    public RoleResponse getRoleById(UUID id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", id));
        return mapToResponse(role);
    }

    @Override
    public List<RoleResponse> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional
    public RoleResponse updateRole(UUID id, RoleRequest request) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", id));

        role.setName(request.name());
        role.setDescription(request.description());

        if (request.permissionIds() != null) {
            Set<Permission> permissions = new HashSet<>(permissionRepository.findAllById(request.permissionIds()));
            role.setPermissions(permissions);
        }

        Role updatedRole = roleRepository.save(role);
        return mapToResponse(updatedRole);
    }

    @Override
    @Transactional
    public void deleteRole(UUID id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", id));
        roleRepository.delete(role);
    }

    private RoleResponse mapToResponse(Role role) {
        Set<String> permissionCodes = role.getPermissions() != null
                ? role.getPermissions().stream().map(Permission::getCode).collect(Collectors.toSet())
                : Set.of();

        return new RoleResponse(
                role.getId(),
                role.getOrganizationId(),
                role.getName(),
                role.getDescription(),
                permissionCodes,
                role.getCreatedAt(),
                role.getUpdatedAt()
        );
    }
}
