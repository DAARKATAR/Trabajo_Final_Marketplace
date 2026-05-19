package com.marketplace.ordenes.dto;

import java.math.BigDecimal;

public class ValidatedItem {
    private Long productoId;
    private Integer cantidad;
    private BigDecimal precio;
    private BigDecimal total;

    public ValidatedItem() {}

    public ValidatedItem(Long productoId, Integer cantidad, BigDecimal precio, BigDecimal total) {
        this.productoId = productoId;
        this.cantidad = cantidad;
        this.precio = precio;
        this.total = total;
    }

    public Long getProductoId() {
        return productoId;
    }

    public void setProductoId(Long productoId) {
        this.productoId = productoId;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public BigDecimal getPrecio() {
        return precio;
    }

    public void setPrecio(BigDecimal precio) {
        this.precio = precio;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }
}
