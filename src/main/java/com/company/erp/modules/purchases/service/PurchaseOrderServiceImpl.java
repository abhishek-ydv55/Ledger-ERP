package com.company.erp.modules.purchases.service;

import com.company.erp.common.exception.BusinessRuleViolationException;
import com.company.erp.common.exception.ResourceNotFoundException;
import com.company.erp.common.tenant.TenantContext;
import com.company.erp.common.util.StateMachine;
import com.company.erp.modules.items.entity.Item;
import com.company.erp.modules.items.repository.ItemRepository;
import com.company.erp.modules.parties.entity.Party;
import com.company.erp.modules.parties.repository.PartyRepository;
import com.company.erp.modules.purchases.dto.PurchaseItemRequest;
import com.company.erp.modules.purchases.dto.PurchaseItemResponse;
import com.company.erp.modules.purchases.dto.PurchaseOrderRequest;
import com.company.erp.modules.purchases.dto.PurchaseOrderResponse;
import com.company.erp.modules.purchases.entity.PurchaseOrder;
import com.company.erp.modules.purchases.entity.PurchaseOrderItem;
import com.company.erp.modules.purchases.entity.PurchaseOrderStatus;
import com.company.erp.modules.purchases.repository.PurchaseOrderRepository;
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
public class PurchaseOrderServiceImpl implements PurchaseOrderService {

    private static final StateMachine<PurchaseOrderStatus> STATE_MACHINE = new StateMachine<>(Map.of(
            PurchaseOrderStatus.DRAFT, Set.of(PurchaseOrderStatus.SUBMITTED, PurchaseOrderStatus.CANCELLED),
            PurchaseOrderStatus.SUBMITTED, Set.of(PurchaseOrderStatus.APPROVED, PurchaseOrderStatus.CANCELLED),
            PurchaseOrderStatus.APPROVED, Set.of(PurchaseOrderStatus.RECEIVED, PurchaseOrderStatus.CANCELLED),
            PurchaseOrderStatus.RECEIVED, Set.of(),
            PurchaseOrderStatus.CANCELLED, Set.of()
    ));

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PartyRepository partyRepository;
    private final ItemRepository itemRepository;

    public PurchaseOrderServiceImpl(PurchaseOrderRepository purchaseOrderRepository,
                                    PartyRepository partyRepository,
                                    ItemRepository itemRepository) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.partyRepository = partyRepository;
        this.itemRepository = itemRepository;
    }

    @Override
    public PurchaseOrderResponse createPurchaseOrder(PurchaseOrderRequest request) {
        if (purchaseOrderRepository.existsByOrderNumber(request.orderNumber())) {
            throw new BusinessRuleViolationException("Purchase order with number '" + request.orderNumber() + "' already exists");
        }

        Party vendor = partyRepository.findById(request.vendorId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with id: " + request.vendorId()));

        PurchaseOrder order = new PurchaseOrder(
                vendor,
                request.orderNumber(),
                request.orderDate(),
                request.expectedDeliveryDate(),
                PurchaseOrderStatus.DRAFT,
                request.notes()
        );
        order.setOrganizationId(TenantContext.getTenantId());

        populateItems(order, request.items());
        PurchaseOrder saved = purchaseOrderRepository.save(order);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PurchaseOrderResponse getPurchaseOrderById(UUID id) {
        PurchaseOrder order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + id));
        return mapToResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PurchaseOrderResponse> getAllPurchaseOrders() {
        return purchaseOrderRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public PurchaseOrderResponse updatePurchaseOrder(UUID id, PurchaseOrderRequest request) {
        PurchaseOrder order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + id));

        if (order.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new BusinessRuleViolationException("Cannot edit purchase order in status: " + order.getStatus());
        }

        if (!order.getOrderNumber().equals(request.orderNumber()) && purchaseOrderRepository.existsByOrderNumber(request.orderNumber())) {
            throw new BusinessRuleViolationException("Purchase order with number '" + request.orderNumber() + "' already exists");
        }

        Party vendor = partyRepository.findById(request.vendorId())
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with id: " + request.vendorId()));

        order.setVendor(vendor);
        order.setOrderNumber(request.orderNumber());
        order.setOrderDate(request.orderDate());
        order.setExpectedDeliveryDate(request.expectedDeliveryDate());
        order.setNotes(request.notes());

        order.getItems().clear();
        populateItems(order, request.items());

        PurchaseOrder updated = purchaseOrderRepository.save(order);
        return mapToResponse(updated);
    }

    @Override
    public PurchaseOrderResponse updateStatus(UUID id, PurchaseOrderStatus newStatus) {
        PurchaseOrder order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + id));

        STATE_MACHINE.validateTransition(order.getStatus(), newStatus);

        order.setStatus(newStatus);
        PurchaseOrder updated = purchaseOrderRepository.save(order);
        return mapToResponse(updated);
    }

    @Override
    public void deletePurchaseOrder(UUID id) {
        PurchaseOrder order = purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found with id: " + id));
        purchaseOrderRepository.delete(order);
    }

    private void populateItems(PurchaseOrder order, List<PurchaseItemRequest> itemRequests) {
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

            PurchaseOrderItem orderItem = new PurchaseOrderItem(
                    item,
                    itemReq.description() != null ? itemReq.description() : item.getName(),
                    qty,
                    price,
                    taxRate,
                    taxAmount,
                    lineTotal
            );
            order.addItem(orderItem);
        }

        order.setSubtotal(subtotal);
        order.setTaxAmount(totalTax);
        order.setTotalAmount(subtotal.add(totalTax));
    }

    private PurchaseOrderResponse mapToResponse(PurchaseOrder order) {
        List<PurchaseItemResponse> itemResponses = order.getItems().stream()
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

        return new PurchaseOrderResponse(
                order.getId(),
                order.getOrganizationId(),
                order.getVendor() != null ? order.getVendor().getId() : null,
                order.getVendor() != null ? order.getVendor().getName() : null,
                order.getOrderNumber(),
                order.getOrderDate(),
                order.getExpectedDeliveryDate(),
                order.getStatus(),
                order.getSubtotal(),
                order.getTaxAmount(),
                order.getTotalAmount(),
                order.getNotes(),
                itemResponses,
                order.getCreatedAt(),
                order.getUpdatedAt()
        );
    }
}
