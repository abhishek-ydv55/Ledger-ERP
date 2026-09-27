package com.company.erp.modules.inventory.entity;

import com.company.erp.common.domain.TenantScopedEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "stock_transfers")
public class StockTransfer extends TenantScopedEntity {

    @Column(name = "transfer_number", nullable = false)
    private String transferNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_warehouse_id", nullable = false)
    private Warehouse sourceWarehouse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destination_warehouse_id", nullable = false)
    private Warehouse destinationWarehouse;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private StockTransferStatus status = StockTransferStatus.DRAFT;

    @Column(name = "notes")
    private String notes;

    @OneToMany(mappedBy = "transfer", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<StockTransferItem> items = new ArrayList<>();

    public StockTransfer() {
    }

    public StockTransfer(String transferNumber, Warehouse sourceWarehouse, Warehouse destinationWarehouse, StockTransferStatus status, String notes) {
        this.transferNumber = transferNumber;
        this.sourceWarehouse = sourceWarehouse;
        this.destinationWarehouse = destinationWarehouse;
        this.status = status;
        this.notes = notes;
    }

    public String getTransferNumber() {
        return transferNumber;
    }

    public void setTransferNumber(String transferNumber) {
        this.transferNumber = transferNumber;
    }

    public Warehouse getSourceWarehouse() {
        return sourceWarehouse;
    }

    public void setSourceWarehouse(Warehouse sourceWarehouse) {
        this.sourceWarehouse = sourceWarehouse;
    }

    public Warehouse getDestinationWarehouse() {
        return destinationWarehouse;
    }

    public void setDestinationWarehouse(Warehouse destinationWarehouse) {
        this.destinationWarehouse = destinationWarehouse;
    }

    public StockTransferStatus getStatus() {
        return status;
    }

    public void setStatus(StockTransferStatus status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public List<StockTransferItem> getItems() {
        return items;
    }

    public void setItems(List<StockTransferItem> items) {
        this.items = items;
    }

    public void addItem(StockTransferItem item) {
        items.add(item);
        item.setTransfer(this);
    }
}
