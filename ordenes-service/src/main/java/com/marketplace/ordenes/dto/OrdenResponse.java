package com.marketplace.ordenes.dto;

import java.math.BigDecimal;
import java.util.List;

public class OrdenResponse {
    private String mensaje;
    private OrdenDetail orden;
    private String codigoCompra;
    private BigDecimal totalGeneral;
    private String estadoPago;

    public OrdenResponse() {}

    public OrdenResponse(String mensaje, OrdenDetail orden, String codigoCompra, BigDecimal totalGeneral, String estadoPago) {
        this.mensaje = mensaje;
        this.orden = orden;
        this.codigoCompra = codigoCompra;
        this.totalGeneral = totalGeneral;
        this.estadoPago = estadoPago;
    }

    public String getMensaje() {
        return mensaje;
    }

    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
    }

    public OrdenDetail getOrden() {
        return orden;
    }

    public void setOrden(OrdenDetail orden) {
        this.orden = orden;
    }

    public String getCodigoCompra() {
        return codigoCompra;
    }

    public void setCodigoCompra(String codigoCompra) {
        this.codigoCompra = codigoCompra;
    }

    public BigDecimal getTotalGeneral() {
        return totalGeneral;
    }

    public void setTotalGeneral(BigDecimal totalGeneral) {
        this.totalGeneral = totalGeneral;
    }

    public String getEstadoPago() {
        return estadoPago;
    }

    public void setEstadoPago(String estadoPago) {
        this.estadoPago = estadoPago;
    }

    public static class OrdenDetail {
        private Long id;
        private String codigoCompra;
        private Integer cantidad;
        private BigDecimal total;
        private String fechaCreacion;
        private List<ValidatedItem> productos;

        public OrdenDetail() {}

        public OrdenDetail(Long id, String codigoCompra, Integer cantidad, BigDecimal total, String fechaCreacion, List<ValidatedItem> productos) {
            this.id = id;
            this.codigoCompra = codigoCompra;
            this.cantidad = cantidad;
            this.total = total;
            this.fechaCreacion = fechaCreacion;
            this.productos = productos;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getCodigoCompra() {
            return codigoCompra;
        }

        public void setCodigoCompra(String codigoCompra) {
            this.codigoCompra = codigoCompra;
        }

        public Integer getCantidad() {
            return cantidad;
        }

        public void setCantidad(Integer cantidad) {
            this.cantidad = cantidad;
        }

        public BigDecimal getTotal() {
            return total;
        }

        public void setTotal(BigDecimal total) {
            this.total = total;
        }

        public String getFechaCreacion() {
            return fechaCreacion;
        }

        public void setFechaCreacion(String fechaCreacion) {
            this.fechaCreacion = fechaCreacion;
        }

        public List<ValidatedItem> getProductos() {
            return productos;
        }

        public void setProductos(List<ValidatedItem> productos) {
            this.productos = productos;
        }
    }
}
