package com.company.erp.modules.sales;

import com.company.erp.common.exception.BusinessRuleViolationException;
import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.sales.entity.Estimate;
import com.company.erp.modules.sales.entity.EstimateStatus;
import com.company.erp.modules.sales.entity.Invoice;
import com.company.erp.modules.sales.entity.InvoiceStatus;
import com.company.erp.modules.sales.entity.SalesOrder;
import com.company.erp.modules.sales.entity.SalesOrderStatus;
import com.company.erp.modules.sales.repository.EstimateRepository;
import com.company.erp.modules.sales.repository.InvoiceRepository;
import com.company.erp.modules.sales.repository.SalesOrderRepository;
import com.company.erp.modules.sales.service.EstimateServiceImpl;
import com.company.erp.modules.sales.service.InvoiceServiceImpl;
import com.company.erp.modules.sales.service.SalesOrderServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SalesStateMachineTest {

    @Mock
    private EstimateRepository estimateRepository;

    @Mock
    private SalesOrderRepository salesOrderRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @InjectMocks
    private EstimateServiceImpl estimateService;

    @InjectMocks
    private SalesOrderServiceImpl salesOrderService;

    @InjectMocks
    private InvoiceServiceImpl invoiceService;

    private final UUID tenantId = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("Estimate state machine enforces allowed transitions and rejects invalid ones")
    void estimateStateMachine_ValidAndInvalidTransitions() {
        UUID estimateId = UUID.randomUUID();
        Estimate estimate = new Estimate();
        estimate.setId(estimateId);
        estimate.setStatus(EstimateStatus.DRAFT);

        when(estimateRepository.findById(estimateId)).thenReturn(Optional.of(estimate));
        when(estimateRepository.save(estimate)).thenReturn(estimate);

        // Valid: DRAFT -> SENT
        estimateService.updateStatus(estimateId, EstimateStatus.SENT);
        assertThat(estimate.getStatus()).isEqualTo(EstimateStatus.SENT);

        // Invalid: SENT -> DRAFT
        assertThatThrownBy(() -> estimateService.updateStatus(estimateId, EstimateStatus.DRAFT))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("Invalid status transition from SENT to DRAFT");
    }

    @Test
    @DisplayName("SalesOrder state machine enforces allowed transitions and rejects invalid ones")
    void salesOrderStateMachine_ValidAndInvalidTransitions() {
        UUID orderId = UUID.randomUUID();
        SalesOrder order = new SalesOrder();
        order.setId(orderId);
        order.setStatus(SalesOrderStatus.CONFIRMED);

        when(salesOrderRepository.findById(orderId)).thenReturn(Optional.of(order));

        // Invalid: CONFIRMED -> DELIVERED (Must go through PROCESSING -> SHIPPED -> DELIVERED)
        assertThatThrownBy(() -> salesOrderService.updateStatus(orderId, SalesOrderStatus.DELIVERED))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("Invalid status transition from CONFIRMED to DELIVERED");
    }

    @Test
    @DisplayName("Invoice state machine enforces allowed transitions and rejects invalid ones")
    void invoiceStateMachine_ValidAndInvalidTransitions() {
        UUID invoiceId = UUID.randomUUID();
        Invoice invoice = new Invoice();
        invoice.setId(invoiceId);
        invoice.setStatus(InvoiceStatus.PAID);

        when(invoiceRepository.findById(invoiceId)).thenReturn(Optional.of(invoice));

        // Invalid: PAID -> ISSUED (Paid is terminal)
        assertThatThrownBy(() -> invoiceService.updateStatus(invoiceId, InvoiceStatus.ISSUED))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("Invalid status transition from PAID to ISSUED");
    }
}
