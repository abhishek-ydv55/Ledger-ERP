package com.company.erp.modules.purchases;

import com.company.erp.common.exception.BusinessRuleViolationException;
import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.purchases.entity.Bill;
import com.company.erp.modules.purchases.entity.BillStatus;
import com.company.erp.modules.purchases.entity.PurchaseOrder;
import com.company.erp.modules.purchases.entity.PurchaseOrderStatus;
import com.company.erp.modules.purchases.repository.BillRepository;
import com.company.erp.modules.purchases.repository.PurchaseOrderRepository;
import com.company.erp.modules.purchases.service.BillServiceImpl;
import com.company.erp.modules.purchases.service.PurchaseOrderServiceImpl;
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
class PurchasesStateMachineTest {

    @Mock
    private PurchaseOrderRepository purchaseOrderRepository;

    @Mock
    private BillRepository billRepository;

    @InjectMocks
    private PurchaseOrderServiceImpl purchaseOrderService;

    @InjectMocks
    private BillServiceImpl billService;

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
    @DisplayName("PurchaseOrder state machine enforces allowed transitions and rejects invalid ones")
    void purchaseOrderStateMachine_ValidAndInvalidTransitions() {
        UUID orderId = UUID.randomUUID();
        PurchaseOrder order = new PurchaseOrder();
        order.setId(orderId);
        order.setStatus(PurchaseOrderStatus.DRAFT);

        when(purchaseOrderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(purchaseOrderRepository.save(order)).thenReturn(order);

        // Valid: DRAFT -> SUBMITTED
        purchaseOrderService.updateStatus(orderId, PurchaseOrderStatus.SUBMITTED);
        assertThat(order.getStatus()).isEqualTo(PurchaseOrderStatus.SUBMITTED);

        // Invalid: SUBMITTED -> RECEIVED (Must go through APPROVED first)
        assertThatThrownBy(() -> purchaseOrderService.updateStatus(orderId, PurchaseOrderStatus.RECEIVED))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("Invalid status transition from SUBMITTED to RECEIVED");
    }

    @Test
    @DisplayName("Bill state machine enforces allowed transitions and rejects invalid ones")
    void billStateMachine_ValidAndInvalidTransitions() {
        UUID billId = UUID.randomUUID();
        Bill bill = new Bill();
        bill.setId(billId);
        bill.setStatus(BillStatus.PAID);

        when(billRepository.findById(billId)).thenReturn(Optional.of(bill));

        // Invalid: PAID -> RECORDED (Paid is terminal)
        assertThatThrownBy(() -> billService.updateStatus(billId, BillStatus.RECORDED))
                .isInstanceOf(BusinessRuleViolationException.class)
                .hasMessageContaining("Invalid status transition from PAID to RECORDED");
    }
}
