package com.marketplace.pagos.dto;

import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;

@JacksonXmlRootElement(localName = "respuesta")
public class PagoXmlResponse {
    private String estado;
    private Integer codigo;
    private String mensaje;

    public PagoXmlResponse() {}

    public PagoXmlResponse(String estado, Integer codigo) {
        this.estado = estado;
        this.codigo = codigo;
    }

    public PagoXmlResponse(String estado, Integer codigo, String mensaje) {
        this.estado = estado;
        this.codigo = codigo;
        this.mensaje = mensaje;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public Integer getCodigo() {
        return codigo;
    }

    public void setCodigo(Integer codigo) {
        this.codigo = codigo;
    }

    public String getMensaje() {
        return mensaje;
    }

    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
    }
}
