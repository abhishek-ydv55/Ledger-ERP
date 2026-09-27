package com.company.erp.common.interceptor;

import com.company.erp.common.context.TenantContext;
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
public class TenantInterceptor implements HandlerInterceptor {

    private static final Logger log = LoggerFactory.getLogger(TenantInterceptor.class);
    public static final String TENANT_HEADER = "X-Tenant-ID";
    private final ObjectProvider<EntityManager> entityManagerProvider;

    public TenantInterceptor(ObjectProvider<EntityManager> entityManagerProvider) {
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

                EntityManager entityManager = entityManagerProvider.getIfAvailable();
                if (entityManager != null) {
                    Session session = entityManager.unwrap(Session.class);
                    session.enableFilter(TenantScopedEntity.TENANT_FILTER_NAME)
                           .setParameter(TenantScopedEntity.TENANT_PARAM_NAME, tenantId);
                }

                log.trace("Tenant filter enabled for tenant: {}", tenantId);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid tenant ID header format: {}", tenantHeader);
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
