package com.company.erp.modules.audit.controller;

import com.company.erp.common.response.ApiResponse;
import com.company.erp.modules.audit.dto.AuditLogResponse;
import com.company.erp.modules.audit.service.AuditService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/audit/logs", "/api/v1/audit/logs"})
@Tag(name = "Audit Logs", description = "System Audit Logging API")
public class AuditLogController {

    private final AuditService auditService;

    public AuditLogController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping
    @Operation(summary = "Get all audit logs")
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> getAllLogs() {
        List<AuditLogResponse> logs = auditService.getAllLogs();
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @GetMapping("/{entityType}/{entityId}")
    @Operation(summary = "Get audit logs for a specific entity")
    public ResponseEntity<ApiResponse<List<AuditLogResponse>>> getLogsByEntity(
            @PathVariable String entityType,
            @PathVariable UUID entityId
    ) {
        List<AuditLogResponse> logs = auditService.getLogsByEntity(entityType, entityId);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }
}
