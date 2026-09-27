package com.company.erp.modules.sales.service;

import com.company.erp.common.exception.BusinessRuleViolationException;
import com.company.erp.common.exception.ResourceNotFoundException;
import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.items.entity.Item;
import com.company.erp.modules.items.repository.ItemRepository;
import com.company.erp.modules.parties.entity.Party;
import com.company.erp.modules.parties.repository.PartyRepository;
import com.company.erp.modules.sales.dto.SalesItemRequest;
import com.company.erp.modules.sales.dto.SalesItemResponse;
import com.company.erp.modules.sales.dto.SalesOrderRequest;
import com.company.erp.modules.sales.dto.SalesOrderResponse;
import com.company.erp.modules.sales.entity.Estimate;
import com.company.erp.modules.sales.entity.SalesOrder;
import com.company.erp.modules.sales.entity.SalesOrderItem;
import com.company.erp.modules.sales.entity.SalesOrderStatus;
import com.company.erp.modules.sales.repository.EstimateRepository;
import com.company.erp.modules.sales.repository.SalesOrderRepository;
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
public class SalesOrderServiceImpl implements SalesOrderService {

    private static final Map<SalesOrderStatus, Set<SalesOrderStatus>> ALLOWED_TRANSITIONS = Map.of(
            SalesOrderStatus.DRAFT, Set.of(SalesOrderStatus.CONFIRMED, SalesOrderStatus.CANCELLED),
            SalesOrderStatus.CONFIRMED, Set.of(SalesOrderStatus.PROCESSING, SalesOrderStatus.CANCELLED),
            SalesOrderStatus.PROCESSING, Set.of(SalesOrderStatus.SHIPPED, SalesOrderStatus.CANCELLED),
            SalesOrderStatus.SHIPPED, Set.of(SalesOrderStatus.DELIVERED),
            SalesOrderStatus.DELIVERED, Set.of(),
            SalesOrderStatus.CANCELLED, Set.of()
    );

    private final SalesOrderRepository salesOrderRepository;
    private final PartyRepository partyRepository;
    private final EstimateRepository estimateRepository;
    private final ItemRepository itemRepository;

    public SalesOrderServiceImpl(SalesOrderRepository salesOrderRepository,
                                 PartyRepository partyRepository,
                                 EstimateRepository estimateRepository,
                                 ItemRepository itemRepository) {
        this.salesOrderRepository = salesOrderRepository;
        this.partyRepository = partyRepository;
        this.estimateRepository = estimateRepository;
        this.itemRepository = itemRepository;
    }

    @Override
    public SalesOrderResponse createSalesOrder(SalesOrderRequest request) {
        if (salesOrderRepository.existsByOrderNumber(request.orderNumber())) {
            throw new BusinessRuleViolationException("Sales order with number '" + request.orderNumber() + "' already exists");
        }

        Party customer = partyRepository.findById(request.customerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.customerId()));

        Estimate estimate = null;
        if (request.estimateId() != null) {
            estimate = estimateRepository.findById(request.estimateId())
                    .orElseThrow(() -> new ResourceNotFoundException("Estimate not found with id: " + request.estimateId()));
        }

        SalesOrder order = new SalesOrder(
                customer,
                estimate,
                request.orderNumber(),
                request.orderDate(),
                SalesOrderStatus.DRAFT,
                request.notes()
        );
        order.setOrganizationId(TenantContext.getTenantId());

        populateItems(order, request.items());
        SalesOrder saved = salesOrderRepository.save(order);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public SalesOrderResponse getSalesOrderById(UUID id) {
        SalesOrder order = salesOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sales order not found with id: " + id));
        return mapToResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SalesOrderResponse> getAllSalesOrders() {
        return salesOrderRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public SalesOrderResponse updateSalesOrder(UUID id, SalesOrderRequest request) {
        SalesOrder order = salesOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sales order not found with id: " + id));

        if (order.getStatus() != SalesOrderStatus.DRAFT) {
            throw new BusinessRuleViolationException("Cannot edit sales order in status: " + order.getStatus());
        }

        if (!order.getOrderNumber().equals(request.orderNumber()) && salesOrderRepository.existsByOrderNumber(request.orderNumber())) {
            throw new BusinessRuleViolationException("Sales order with number '" + request.orderNumber() + "' already exists");
        }

        Party customer = partyRepository.findById(request.customerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.customerId()));

        Estimate estimate = null;
        if (request.estimateId() != null) {
            estimate = estimateRepository.findById(request.estimateId())
                    .orElseThrow(() -> new ResourceNotFoundException("Estimate not found with id: " + request.estimateId()));
        }

        order.setCustomer(customer);
        order.setEstimate(estimate);
        order.setOrderNumber(request.orderNumber());
        order.setOrderDate(request.orderDate());
        order.setNotes(request.notes());

        order.getItems().clear();
        populateItems(order, request.items());

        SalesOrder updated = salesOrderRepository.save(order);
        return mapToResponse(updated);
    }

    @Override
    public SalesOrderResponse updateStatus(UUID id, SalesOrderStatus newStatus) {
        SalesOrder order = salesOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sales order not found with id: " + id));

        Set<SalesOrderStatus> allowed = ALLOWED_TRANSITIONS.getOrDefault(order.getStatus(), Set.of());
        if (!allowed.contains(newStatus)) {
            throw new BusinessRuleViolationException("Invalid status transition from " + order.getStatus() + " to " + newStatus);
        }

        order.setStatus(newStatus);
        SalesOrder updated = salesOrderRepository.save(order);
        return mapToResponse(updated);
    }

    @Override
    public void deleteSalesOrder(UUID id) {
        SalesOrder order = salesOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sales order not found with id: " + id));
        salesOrderRepository.delete(order);
    }

    private void populateItems(SalesOrder order, List<SalesItemRequest> itemRequests) {
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;

        for (SalesItemRequest itemReq : itemRequests) {
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

            SalesOrderItem orderItem = new SalesOrderItem(
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

    private SalesOrderResponse mapToResponse(SalesOrder order) {
        List<SalesItemResponse> itemResponses = order.getItems().stream()
                .map(item -> new SalesItemResponse(
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

        return new SalesOrderResponse(
                order.getId(),
                order.getOrganizationId(),
                order.getCustomer() != null ? order.getCustomer().getId() : null,
                order.getCustomer() != null ? order.getCustomer().getName() : null,
                order.getEstimate() != null ? order.getEstimate().getId() : null,
                order.getOrderNumber(),
                order.getOrderDate(),
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
