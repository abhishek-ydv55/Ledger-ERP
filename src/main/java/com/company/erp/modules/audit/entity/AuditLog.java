package com.company.erp.modules.audit.entity;

import com.company.erp.common.domain.TenantScopedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.UUID;

@Entity
@Table(name = "audit_logs")
public class AuditLog extends TenantScopedEntity {

    @Column(name = "entity_type", nullable = false)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Column(name = "action", nullable = false)
    private String action;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "old_snapshot", columnDefinition = "jsonb")
    private String oldSnapshot;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "new_snapshot", columnDefinition = "jsonb")
    private String newSnapshot;

    @Column(name = "actor_id")
    private UUID actorId;

    public AuditLog() {
    }

    public AuditLog(String entityType, UUID entityId, String action, String oldSnapshot, String newSnapshot, UUID actorId) {
        this.entityType = entityType;
        this.entityId = entityId;
        this.action = action;
        this.oldSnapshot = oldSnapshot;
        this.newSnapshot = newSnapshot;
        this.actorId = actorId;
    }

    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    public UUID getEntityId() {
        return entityId;
    }

    public void setEntityId(UUID entityId) {
        this.entityId = entityId;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getOldSnapshot() {
        return oldSnapshot;
    }

    public void setOldSnapshot(String oldSnapshot) {
        this.oldSnapshot = oldSnapshot;
    }

    public String getNewSnapshot() {
        return newSnapshot;
    }

    public void setNewSnapshot(String newSnapshot) {
        this.newSnapshot = newSnapshot;
    }

    public UUID getActorId() {
        return actorId;
    }

    public void setActorId(UUID actorId) {
        this.actorId = actorId;
    }
}
