package com.company.erp.common.tenant;

import com.company.erp.common.domain.TenantScopedEntity;
import jakarta.persistence.EntityManager;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.hibernate.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.UUID;

@Component
public class TenantFilterInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(TenantFilterInterceptor.class);
    public static final String TENANT_HEADER = "X-Tenant-ID";
    private final ObjectProvider<EntityManager> entityManagerProvider;

    public TenantFilterInterceptor(ObjectProvider<EntityManager> entityManagerProvider) {
        this.entityManagerProvider = entityManagerProvider;
    }

    @Override
    public boolean preHandle(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull Object handler
    ) {
        String tenantHeader = request.getHeader(TENANT_HEADER);

        if (tenantHeader != null && !tenantHeader.isBlank()) {
            try {
                UUID tenantId = UUID.fromString(tenantHeader.trim());
                TenantContext.setTenantId(tenantId);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid tenant ID header format: {}", tenantHeader);
            }
        }

        UUID activeTenantId = TenantContext.getTenantId();
        if (activeTenantId != null) {
            EntityManager entityManager = entityManagerProvider.getIfAvailable();
            if (entityManager != null) {
                Session session = entityManager.unwrap(Session.class);
                session.enableFilter(TenantScopedEntity.TENANT_FILTER_NAME)
                       .setParameter(TenantScopedEntity.TENANT_PARAM_NAME, activeTenantId);
                log.trace("Tenant filter enabled for organization: {}", activeTenantId);
            }
        }

        return true;
    }

    @Override
    public void afterCompletion(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull Object handler,
            Exception ex
    ) {
        TenantContext.clear();
    }
}
