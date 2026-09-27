package com.company.erp.modules.inventory.entity;

import com.company.erp.common.domain.BaseEntity;
import com.company.erp.modules.items.entity.Item;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;

@Entity
@Table(name = "stock_transfer_items")
public class StockTransferItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transfer_id", nullable = false)
    private StockTransfer transfer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @Column(name = "quantity", nullable = false)
    private BigDecimal quantity;

    public StockTransferItem() {
    }

    public StockTransferItem(Item item, BigDecimal quantity) {
        this.item = item;
        this.quantity = quantity;
    }

    public StockTransfer getTransfer() {
        return transfer;
    }

    public void setTransfer(StockTransfer transfer) {
        this.transfer = transfer;
    }

    public Item getItem() {
        return item;
    }

    public void setItem(Item item) {
        this.item = item;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }
}
