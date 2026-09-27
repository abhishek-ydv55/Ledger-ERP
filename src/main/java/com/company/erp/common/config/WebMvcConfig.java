package com.company.erp.common.config;

import com.company.erp.common.tenant.TenantFilterInterceptor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final ObjectProvider<TenantFilterInterceptor> tenantFilterInterceptorProvider;

    public WebMvcConfig(ObjectProvider<TenantFilterInterceptor> tenantFilterInterceptorProvider) {
        this.tenantFilterInterceptorProvider = tenantFilterInterceptorProvider;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        TenantFilterInterceptor interceptor = tenantFilterInterceptorProvider.getIfAvailable();
        if (interceptor != null) {
            registry.addInterceptor(interceptor)
                    .addPathPatterns("/api/**");
        }
    }
}
