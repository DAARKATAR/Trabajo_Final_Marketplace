package com.marketplace.pagos.controller;

import com.marketplace.pagos.dto.PagoXmlRequest;
import com.marketplace.pagos.dto.PagoXmlResponse;
import com.marketplace.pagos.entity.Pago;
import com.marketplace.pagos.repository.PagoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
public class PagoController {

    @Autowired
    private PagoRepository pagoRepository;

    /**
     * POST /pagos
     * Endpoint bancario mock que acepta XML y procesa el cobro simulado.
     * Persiste la aprobación en la base de datos de pagos (pagos_db).
     */
    @PostMapping(
            value = "/pagos",
            consumes = {MediaType.APPLICATION_XML_VALUE, MediaType.TEXT_XML_VALUE, "text/xml"},
            produces = {MediaType.APPLICATION_XML_VALUE, MediaType.TEXT_XML_VALUE}
    )
    public ResponseEntity<PagoXmlResponse> procesarPago(@RequestBody PagoXmlRequest request) {
        if (request == null || request.getUsuarioId() == null || request.getMonto() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new PagoXmlResponse("RECHAZADO", 400, "XML Invalido"));
        }

        System.out.println("[SOAP Bank - Java] Pago recibido. Usuario: " + request.getUsuarioId() + ", Monto: " + request.getMonto());

        try {
            String estado = "APROBADO";
            String metodo = request.getMetodoPago();
            if (metodo != null && (metodo.toLowerCase().contains("rechaz") || metodo.toLowerCase().contains("fallo") || metodo.toLowerCase().contains("error"))) {
                estado = "RECHAZADO";
            }

            // Guardar transación de pago en BD pagos_db
            Pago pago = new Pago(request.getUsuarioId(), request.getMonto(), estado);
            pagoRepository.save(pago);

            if ("RECHAZADO".equals(estado)) {
                System.out.println("[SOAP Bank - Java] Pago RECHAZADO (Simulación de fallo).");
                return ResponseEntity.ok(new PagoXmlResponse("RECHAZADO", 402, "Transacción de pago rechazada por el banco emisor (Simulación de Fallo)"));
            }

            return ResponseEntity.ok(new PagoXmlResponse("APROBADO", 200));
        } catch (Exception e) {
            System.err.println("[SOAP Bank - Java] Error al guardar pago en BD: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new PagoXmlResponse("RECHAZADO", 500, "Error interno de base de datos bancaria"));
        }
    }
}
