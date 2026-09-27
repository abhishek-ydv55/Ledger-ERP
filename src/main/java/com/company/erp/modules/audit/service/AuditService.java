package com.company.erp.modules.audit.service;

import com.company.erp.modules.audit.dto.AuditLogResponse;

import java.util.List;
import java.util.UUID;

public interface AuditService {
    void record(String entityType, UUID entityId, String action, Object oldSnapshot, Object newSnapshot, UUID actorId);
    void record(String entityType, UUID entityId, String action, Object oldSnapshot, Object newSnapshot);
    List<AuditLogResponse> getLogsByEntity(String entityType, UUID entityId);
    List<AuditLogResponse> getAllLogs();
}
