package com.company.erp.modules.sales.service;

import com.company.erp.common.exception.BusinessRuleViolationException;
import com.company.erp.common.exception.ResourceNotFoundException;
import com.company.erp.common.tenant.TenantContext;
import com.company.erp.modules.inventory.entity.Warehouse;
import com.company.erp.modules.inventory.repository.WarehouseRepository;
import com.company.erp.modules.items.entity.Item;
import com.company.erp.modules.items.repository.ItemRepository;
import com.company.erp.modules.parties.entity.Party;
import com.company.erp.modules.parties.repository.PartyRepository;
import com.company.erp.modules.sales.dto.InvoiceRequest;
import com.company.erp.modules.sales.dto.InvoiceResponse;
import com.company.erp.modules.sales.dto.SalesItemRequest;
import com.company.erp.modules.sales.dto.SalesItemResponse;
import com.company.erp.modules.sales.entity.Invoice;
import com.company.erp.modules.sales.entity.InvoiceItem;
import com.company.erp.modules.sales.entity.InvoiceStatus;
import com.company.erp.modules.sales.entity.SalesOrder;
import com.company.erp.modules.sales.event.InvoiceIssuedEvent;
import com.company.erp.modules.sales.repository.InvoiceRepository;
import com.company.erp.modules.sales.repository.SalesOrderRepository;
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
public class InvoiceServiceImpl implements InvoiceService {

    private static final Map<InvoiceStatus, Set<InvoiceStatus>> ALLOWED_TRANSITIONS = Map.of(
            InvoiceStatus.DRAFT, Set.of(InvoiceStatus.ISSUED, InvoiceStatus.CANCELLED),
            InvoiceStatus.ISSUED, Set.of(InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.PAID, InvoiceStatus.VOID, InvoiceStatus.OVERDUE),
            InvoiceStatus.PARTIALLY_PAID, Set.of(InvoiceStatus.PAID, InvoiceStatus.VOID),
            InvoiceStatus.PAID, Set.of(),
            InvoiceStatus.VOID, Set.of(),
            InvoiceStatus.OVERDUE, Set.of(InvoiceStatus.PAID, InvoiceStatus.VOID),
            InvoiceStatus.CANCELLED, Set.of()
    );

    private final InvoiceRepository invoiceRepository;
    private final PartyRepository partyRepository;
    private final SalesOrderRepository salesOrderRepository;
    private final WarehouseRepository warehouseRepository;
    private final ItemRepository itemRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final com.company.erp.modules.audit.service.AuditService auditService;

    public InvoiceServiceImpl(InvoiceRepository invoiceRepository,
                              PartyRepository partyRepository,
                              SalesOrderRepository salesOrderRepository,
                              WarehouseRepository warehouseRepository,
                              ItemRepository itemRepository,
                              ApplicationEventPublisher eventPublisher,
                              com.company.erp.modules.audit.service.AuditService auditService) {
        this.invoiceRepository = invoiceRepository;
        this.partyRepository = partyRepository;
        this.salesOrderRepository = salesOrderRepository;
        this.warehouseRepository = warehouseRepository;
        this.itemRepository = itemRepository;
        this.eventPublisher = eventPublisher;
        this.auditService = auditService;
    }

    @Override
    public InvoiceResponse createInvoice(InvoiceRequest request) {
        if (invoiceRepository.existsByInvoiceNumber(request.invoiceNumber())) {
            throw new BusinessRuleViolationException("Invoice with number '" + request.invoiceNumber() + "' already exists");
        }

        Party customer = partyRepository.findById(request.customerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.customerId()));

        SalesOrder salesOrder = null;
        if (request.salesOrderId() != null) {
            salesOrder = salesOrderRepository.findById(request.salesOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sales order not found with id: " + request.salesOrderId()));
        }

        Warehouse warehouse = null;
        if (request.warehouseId() != null) {
            warehouse = warehouseRepository.findById(request.warehouseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with id: " + request.warehouseId()));
        }

        Invoice invoice = new Invoice(
                customer,
                salesOrder,
                warehouse,
                request.invoiceNumber(),
                request.invoiceDate(),
                request.dueDate(),
                InvoiceStatus.DRAFT,
                request.notes()
        );
        invoice.setOrganizationId(TenantContext.getTenantId());

        populateItems(invoice, request.items());
        Invoice saved = invoiceRepository.save(invoice);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceById(UUID id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));
        return mapToResponse(invoice);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceResponse> getAllInvoices() {
        return invoiceRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public InvoiceResponse updateInvoice(UUID id, InvoiceRequest request) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));

        if (invoice.getStatus() != InvoiceStatus.DRAFT) {
            throw new BusinessRuleViolationException("Cannot edit invoice in status: " + invoice.getStatus());
        }

        if (!invoice.getInvoiceNumber().equals(request.invoiceNumber()) && invoiceRepository.existsByInvoiceNumber(request.invoiceNumber())) {
            throw new BusinessRuleViolationException("Invoice with number '" + request.invoiceNumber() + "' already exists");
        }

        Party customer = partyRepository.findById(request.customerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + request.customerId()));

        SalesOrder salesOrder = null;
        if (request.salesOrderId() != null) {
            salesOrder = salesOrderRepository.findById(request.salesOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sales order not found with id: " + request.salesOrderId()));
        }

        Warehouse warehouse = null;
        if (request.warehouseId() != null) {
            warehouse = warehouseRepository.findById(request.warehouseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found with id: " + request.warehouseId()));
        }

        invoice.setCustomer(customer);
        invoice.setSalesOrder(salesOrder);
        invoice.setWarehouse(warehouse);
        invoice.setInvoiceNumber(request.invoiceNumber());
        invoice.setInvoiceDate(request.invoiceDate());
        invoice.setDueDate(request.dueDate());
        invoice.setNotes(request.notes());

        invoice.getItems().clear();
        populateItems(invoice, request.items());

        Invoice updated = invoiceRepository.save(invoice);
        return mapToResponse(updated);
    }

    @Override
    public InvoiceResponse updateStatus(UUID id, InvoiceStatus newStatus) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));

        Set<InvoiceStatus> allowed = ALLOWED_TRANSITIONS.getOrDefault(invoice.getStatus(), Set.of());
        if (!allowed.contains(newStatus)) {
            throw new BusinessRuleViolationException("Invalid status transition from " + invoice.getStatus() + " to " + newStatus);
        }

        InvoiceStatus oldStatus = invoice.getStatus();
        invoice.setStatus(newStatus);
        Invoice updated = invoiceRepository.save(invoice);
        InvoiceResponse response = mapToResponse(updated);

        if (newStatus == InvoiceStatus.VOID) {
            auditService.record("INVOICE", updated.getId(), "VOID", oldStatus, response);
        }

        return response;
    }

    @Override
    public InvoiceResponse issueInvoice(UUID id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));

        Set<InvoiceStatus> allowed = ALLOWED_TRANSITIONS.getOrDefault(invoice.getStatus(), Set.of());
        if (!allowed.contains(InvoiceStatus.ISSUED)) {
            throw new BusinessRuleViolationException("Invalid status transition from " + invoice.getStatus() + " to " + InvoiceStatus.ISSUED);
        }

        InvoiceStatus oldStatus = invoice.getStatus();
        invoice.setStatus(InvoiceStatus.ISSUED);
        Invoice saved = invoiceRepository.save(invoice);

        eventPublisher.publishEvent(new InvoiceIssuedEvent(saved));

        InvoiceResponse response = mapToResponse(saved);
        auditService.record("INVOICE", saved.getId(), "ISSUE", oldStatus, response);
        return response;
    }

    @Override
    public void deleteInvoice(UUID id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));
        invoiceRepository.delete(invoice);
    }

    private void populateItems(Invoice invoice, List<SalesItemRequest> itemRequests) {
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

            InvoiceItem invoiceItem = new InvoiceItem(
                    item,
                    itemReq.description() != null ? itemReq.description() : item.getName(),
                    qty,
                    price,
                    taxRate,
                    taxAmount,
                    lineTotal
            );
            invoice.addItem(invoiceItem);
        }

        invoice.setSubtotal(subtotal);
        invoice.setTaxAmount(totalTax);
        BigDecimal total = subtotal.add(totalTax);
        invoice.setTotalAmount(total);
        invoice.setBalanceDue(total.subtract(invoice.getAmountPaid()));
    }

    private InvoiceResponse mapToResponse(Invoice invoice) {
        List<SalesItemResponse> itemResponses = invoice.getItems().stream()
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

        return new InvoiceResponse(
                invoice.getId(),
                invoice.getOrganizationId(),
                invoice.getCustomer() != null ? invoice.getCustomer().getId() : null,
                invoice.getCustomer() != null ? invoice.getCustomer().getName() : null,
                invoice.getSalesOrder() != null ? invoice.getSalesOrder().getId() : null,
                invoice.getWarehouse() != null ? invoice.getWarehouse().getId() : null,
                invoice.getWarehouse() != null ? invoice.getWarehouse().getName() : null,
                invoice.getInvoiceNumber(),
                invoice.getInvoiceDate(),
                invoice.getDueDate(),
                invoice.getStatus(),
                invoice.getSubtotal(),
                invoice.getTaxAmount(),
                invoice.getTotalAmount(),
                invoice.getAmountPaid(),
                invoice.getBalanceDue(),
                invoice.getNotes(),
                itemResponses,
                invoice.getCreatedAt(),
                invoice.getUpdatedAt()
        );
    }
}
