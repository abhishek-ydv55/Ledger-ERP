package com.company.erp.modules.purchases.service;

import com.company.erp.common.exception.BusinessRuleViolationException;
import com.company.erp.common.exception.ResourceNotFoundException;
import com.company.erp.common.tenant.TenantContext;
import com.company.erp.common.util.StateMachine;
import com.company.erp.modules.inventory.entity.Warehouse;
import com.company.erp.modules.inventory.repository.WarehouseRepository;
import com.company.erp.modules.items.entity.Item;
import com.company.erp.modules.items.repository.ItemRepository;
import com.company.erp.modules.parties.entity.Party;
import com.company.erp.modules.parties.repository.PartyRepository;
import com.company.erp.modules.purchases.dto.BillRequest;
import com.company.erp.modules.purchases.dto.BillResponse;
import com.company.erp.modules.purchases.dto.PurchaseItemRequest;
import com.company.erp.modules.purchases.dto.PurchaseItemResponse;
import com.company.erp.modules.purchases.entity.Bill;
import com.company.erp.modules.purchases.entity.BillItem;
import com.company.erp.modules.purchases.entity.BillStatus;
import com.company.erp.modules.purchases.entity.PurchaseOrder;
import com.company.erp.modules.purchases.event.BillRecordedEvent;
import com.company.erp.modules.purchases.repository.BillRepository;
import com.company.erp.modules.purchases.repository.PurchaseOrderRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class BillServiceImpl implements BillService {

    private static final StateMachine<BillStatus> STATE_MACHINE = new StateMachine<>(Map.of(
            BillStatus.DRAFT, Set.of(BillStatus.RECORDED, BillStatus.CANCELLED),
            BillStatus.RECORDED, Set.of(BillStatus.PARTIALLY_PAID, BillStatus.PAID, BillStatus.VOID),
            BillStatus.PARTIALLY_PAID, Set.of(BillStatus.PAID, BillStatus.VOID),
            BillStatus.PAID, Set.of(),
            BillStatus.VOID, Set.of(),
            BillStatus.CANCELLED, Set.of()
    ));

    private final BillRepository billRepository;
    private final PartyRepository partyRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final WarehouseRepository warehouseRepository;
    private final ItemRepository itemRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final com.company.erp.modules.audit.service.AuditService auditService;

    public BillServiceImpl(BillRepository billRepository,
                           PartyRepository partyRepository,
                           PurchaseOrderRepository purchaseOrderRepository,
                           WarehouseRepository warehouseRepository,
                           ItemRepository itemRepository,
                           ApplicationEventPublisher eventPublisher,
                           com.company.erp.modules.audit.service.AuditService auditService) {
        this.billRepository = billRepository;
        this.partyRepository = partyRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.warehouseRepository = warehouseRepository;
        this.itemRepository = itemRepository;
        this.eventPublisher = eventPublisher;
        this.auditService = auditService;
    }

    @Override
    public BillResponse createBill(BillRequest request) {
        if (billRepository.existsByBillNumber(request.billNumber())) {
            throw new BusinessRuleViolationException("Bill with number '" + request.billNumber() + "' already exists");
        }

        Party vendor = partyRepository.findById(request.vendorId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with id: " + request.vendorId()));

        PurchaseOrder purchaseOrder = null;
        if (request.purchaseOrderId() != null) {
            purchaseOrder = purchaseOrderRepository.findById(request.purchaseOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + request.purchaseOrderId()));
        }

        Warehouse warehouse = null;
        if (request.warehouseId() != null) {
            warehouse = warehouseRepository.findById(request.warehouseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with id: " + request.warehouseId()));
        }

        Bill bill = new Bill(
                vendor,
                purchaseOrder,
                warehouse,
                request.billNumber(),
                request.billDate(),
                request.dueDate(),
                BillStatus.DRAFT,
                request.notes()
        );
        bill.setOrganizationId(TenantContext.getTenantId());

        populateItems(bill, request.items());
        Bill saved = billRepository.save(bill);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public BillResponse getBillById(UUID id) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + id));
        return mapToResponse(bill);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BillResponse> getAllBills() {
        return billRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public BillResponse updateBill(UUID id, BillRequest request) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + id));

        if (bill.getStatus() != BillStatus.DRAFT) {
            throw new BusinessRuleViolationException("Cannot edit bill in status: " + bill.getStatus());
        }

        if (!bill.getBillNumber().equals(request.billNumber()) && billRepository.existsByBillNumber(request.billNumber())) {
            throw new BusinessRuleViolationException("Bill with number '" + request.billNumber() + "' already exists");
        }

        Party vendor = partyRepository.findById(request.vendorId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with id: " + request.vendorId()));

        PurchaseOrder purchaseOrder = null;
        if (request.purchaseOrderId() != null) {
            purchaseOrder = purchaseOrderRepository.findById(request.purchaseOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + request.purchaseOrderId()));
        }

        Warehouse warehouse = null;
        if (request.warehouseId() != null) {
            warehouse = warehouseRepository.findById(request.warehouseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with id: " + request.warehouseId()));
        }

        bill.setVendor(vendor);
        bill.setPurchaseOrder(purchaseOrder);
        bill.setWarehouse(warehouse);
        bill.setBillNumber(request.billNumber());
        bill.setBillDate(request.billDate());
        bill.setDueDate(request.dueDate());
        bill.setNotes(request.notes());

        bill.getItems().clear();
        populateItems(bill, request.items());

        Bill updated = billRepository.save(bill);
        return mapToResponse(updated);
    }

    @Override
    public BillResponse updateStatus(UUID id, BillStatus newStatus) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + id));

        STATE_MACHINE.validateTransition(bill.getStatus(), newStatus);

        BillStatus oldStatus = bill.getStatus();
        bill.setStatus(newStatus);
        Bill updated = billRepository.save(bill);
        BillResponse response = mapToResponse(updated);

        if (newStatus == BillStatus.VOID) {
            auditService.record("BILL", updated.getId(), "VOID", oldStatus, response);
        }

        return response;
    }

    @Override
    public BillResponse recordBill(UUID id) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + id));

        STATE_MACHINE.validateTransition(bill.getStatus(), BillStatus.RECORDED);

        BillStatus oldStatus = bill.getStatus();
        bill.setStatus(BillStatus.RECORDED);
        Bill saved = billRepository.save(bill);

        eventPublisher.publishEvent(new BillRecordedEvent(saved));

        BillResponse response = mapToResponse(saved);
        auditService.record("BILL", saved.getId(), "RECORD", oldStatus, response);
        return response;
    }

    @Override
    public void deleteBill(UUID id) {
        Bill bill = billRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found with id: " + id));
        billRepository.delete(bill);
    }

    private void populateItems(Bill bill, List<PurchaseItemRequest> itemRequests) {
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;

        for (PurchaseItemRequest itemReq : itemRequests) {
            Item item = itemRepository.findById(itemReq.itemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Item not found with id: " + itemReq.itemId()));

            BigDecimal qty = itemReq.quantity();
            BigDecimal price = itemReq.unitPrice();
            BigDecimal lineSubtotal = qty.multiply(price);

            BigDecimal taxRate = itemReq.taxRate() != null ? itemReq.taxRate() : BigDecimal.ZERO;
            BigDecimal taxAmount = lineSubtotal.multiply(taxRate).divide(new BigDecimal("100"), 4, java.math.RoundingMode.HALF_UP);
            BigDecimal lineTotal = lineSubtotal.add(taxAmount);

            subtotal = subtotal.add(lineSubtotal);
            totalTax = totalTax.add(taxAmount);

            BillItem billItem = new BillItem(
                    item,
                    itemReq.description() != null ? itemReq.description() : item.getName(),
                    qty,
                    price,
                    taxRate,
                    taxAmount,
                    lineTotal
            );
            bill.addItem(billItem);
        }

        bill.setSubtotal(subtotal);
        bill.setTaxAmount(totalTax);
        BigDecimal total = subtotal.add(totalTax);
        bill.setTotalAmount(total);
        bill.setBalanceDue(total.subtract(bill.getAmountPaid()));
    }

    private BillResponse mapToResponse(Bill bill) {
        List<PurchaseItemResponse> itemResponses = bill.getItems().stream()
                .map(item -> new PurchaseItemResponse(
                        item.getId(),
                        item.getItem().getId(),
                        item.getItem().getName(),
                        item.getItem().getSku(),
                        item.getDescription(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getTaxRate(),
                        item.getTaxAmount(),
                        item.getTotalAmount()
                ))
                .collect(Collectors.toList());

        return new BillResponse(
                bill.getId(),
                bill.getOrganizationId(),
                bill.getVendor() != null ? bill.getVendor().getId() : null,
                bill.getVendor() != null ? bill.getVendor().getName() : null,
                bill.getPurchaseOrder() != null ? bill.getPurchaseOrder().getId() : null,
                bill.getWarehouse() != null ? bill.getWarehouse().getId() : null,
                bill.getWarehouse() != null ? bill.getWarehouse().getName() : null,
                bill.getBillNumber(),
                bill.getBillDate(),
                bill.getDueDate(),
                bill.getStatus(),
                bill.getSubtotal(),
                bill.getTaxAmount(),
                bill.getTotalAmount(),
                bill.getAmountPaid(),
                bill.getBalanceDue(),
                bill.getNotes(),
                itemResponses,
                bill.getCreatedAt(),
                bill.getUpdatedAt()
        );
    }
}
