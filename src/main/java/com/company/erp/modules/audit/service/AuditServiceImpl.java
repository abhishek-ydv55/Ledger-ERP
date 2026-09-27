package com.company.erp.modules.audit.service;

import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.audit.dto.AuditLogResponse;
import com.company.erp.modules.audit.entity.AuditLog;
import com.company.erp.modules.audit.repository.AuditLogRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class AuditServiceImpl implements AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditServiceImpl.class);

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public AuditServiceImpl(AuditLogRepository auditLogRepository, ObjectMapper objectMapper) {
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public void record(String entityType, UUID entityId, String action, Object oldSnapshot, Object newSnapshot, UUID actorId) {
        UUID finalActorId = actorId != null ? actorId : resolveActorId();
        String oldJson = serialize(oldSnapshot);
        String newJson = serialize(newSnapshot);

        AuditLog auditLog = new AuditLog(entityType, entityId, action, oldJson, newJson, finalActorId);
        auditLog.setOrganizationId(TenantContext.getTenantId());

        auditLogRepository.save(auditLog);
    }

    @Override
    public void record(String entityType, UUID entityId, String action, Object oldSnapshot, Object newSnapshot) {
        record(entityType, entityId, action, oldSnapshot, newSnapshot, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogResponse> getLogsByEntity(String entityType, UUID entityId) {
        return auditLogRepository.findByEntityTypeAndEntityId(entityType, entityId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogResponse> getAllLogs() {
        return auditLogRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private String serialize(Object obj) {
        if (obj == null) {
            return null;
        }
        if (obj instanceof String str) {
            return str;
        }
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            log.warn("Failed to serialize audit snapshot for entity: {}", obj, e);
            return String.valueOf(obj);
        }
    }

    private UUID resolveActorId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() != null) {
            Object principal = auth.getPrincipal();
            if (principal instanceof String principalStr) {
                try {
                    return UUID.fromString(principalStr);
                } catch (IllegalArgumentException ignored) {
                }
            } else if (principal instanceof UUID uuidPrincipal) {
                return uuidPrincipal;
            }
        }
        return null;
    }

    private AuditLogResponse mapToResponse(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getOrganizationId(),
                log.getEntityType(),
                log.getEntityId(),
                log.getAction(),
                log.getOldSnapshot(),
                log.getNewSnapshot(),
                log.getActorId(),
                log.getCreatedAt(),
                log.getUpdatedAt()
        );
    }
}
