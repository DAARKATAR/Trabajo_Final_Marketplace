package com.marketplace.ordenes.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.marketplace.ordenes.dto.OrdenRequest;
import com.marketplace.ordenes.dto.OrdenResponse;
import com.marketplace.ordenes.dto.ValidatedItem;
import com.marketplace.ordenes.entity.Orden;
import com.marketplace.ordenes.repository.OrdenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/ordenes")
public class OrdenController {

    @Autowired
    private OrdenRepository ordenRepository;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String uddiPath = "../registro-servicios/servicios.json";

    /**
     * Resuelve dinámicamente la dirección del servicio desde servicios.json
     */
    private String getServiceUrl(String nombre) {
        try {
            File file = new File(uddiPath);
            if (!file.exists()) {
                file = new File("registro-servicios/servicios.json");
            }
            List<Map<String, String>> servicios = objectMapper.readValue(file, List.class);
            for (Map<String, String> srv : servicios) {
                if (nombre.equals(srv.get("nombre"))) {
                    return srv.get("url");
                }
            }
        } catch (IOException e) {
            System.err.println("No se pudo cargar el registro UDDI: " + e.getMessage());
        }
        return null;
    }

    /**
     * POST /ordenes
     * Procesa la creación y cobro unificado de la orden de compra.
     */
    @PostMapping
    public ResponseEntity<?> registrarOrden(@RequestBody OrdenRequest request) {
        // Soporte dual para compras unitarias antiguas y carritos compuestos
        List<OrdenRequest.Item> items = request.getProductos();
        if (items == null || items.isEmpty()) {
            items = new ArrayList<>();
            if (request.getProductoId() != null && request.getCantidad() != null) {
                items.add(new OrdenRequest.Item(request.getProductoId(), request.getCantidad()));
            }
        }

        if (request.getUsuarioId() == null || items.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Faltan parámetros (usuarioId, productos)"));
        }

        String usuariosUrl = getServiceUrl("usuarios-service");
        String productosUrl = getServiceUrl("productos-service");
        String pagosUrl = getServiceUrl("pagos-soap-service");

        if (usuariosUrl == null || productosUrl == null || pagosUrl == null) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Servicios de soporte no disponibles en UDDI"));
        }

        try {
            // 1. Validar existencia del usuario
            try {
                restTemplate.getForObject(usuariosUrl + "/usuarios/" + request.getUsuarioId(), Object.class);
            } catch (HttpStatusCodeException ex) {
                if (ex.getStatusCode() == HttpStatus.NOT_FOUND) {
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Usuario o Producto no encontrado"));
                }
                throw ex;
            }

            // 2. Validar cada producto y calcular monto total
            BigDecimal montoTotal = BigDecimal.ZERO;
            List<ValidatedItem> validatedItems = new ArrayList<>();
            int cantidadTotal = 0;

            for (OrdenRequest.Item item : items) {
                try {
                    Map<String, Object> prod = restTemplate.getForObject(productosUrl + "/productos/" + item.getProductoId(), Map.class);
                    if (prod == null) {
                        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Usuario o Producto no encontrado"));
                    }
                    BigDecimal precio = new BigDecimal(prod.get("precio").toString());
                    BigDecimal totalItem = precio.multiply(BigDecimal.valueOf(item.getCantidad()));
                    montoTotal = montoTotal.add(totalItem);
                    cantidadTotal += item.getCantidad();

                    validatedItems.add(new ValidatedItem(
                            item.getProductoId(),
                            item.getCantidad(),
                            precio,
                            totalItem
                    ));
                } catch (HttpStatusCodeException ex) {
                    if (ex.getStatusCode() == HttpStatus.NOT_FOUND) {
                        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Usuario o Producto no encontrado"));
                    }
                    throw ex;
                }
            }

            // 3. Enviar pago por SOAP/XML al core bancario
            String metodoPago = request.getMetodoPago() != null ? request.getMetodoPago() : "Tarjeta";
            String xmlPayload = String.format(
                    "<pago>\n  <usuarioId>%d</usuarioId>\n  <monto>%s</monto>\n  <metodoPago>%s</metodoPago>\n</pago>",
                    request.getUsuarioId(),
                    montoTotal.toString(),
                    metodoPago
            ).trim();

            HttpHeaders soapHeaders = new HttpHeaders();
            soapHeaders.setContentType(MediaType.APPLICATION_XML);
            HttpEntity<String> soapRequest = new HttpEntity<>(xmlPayload, soapHeaders);

            String soapRes = null;
            String estadoPago = "RECHAZADO";
            try {
                soapRes = restTemplate.postForObject(pagosUrl + "/pagos", soapRequest, String.class);
                if (soapRes != null && soapRes.contains("APROBADO")) {
                    estadoPago = "APROBADO";
                }
            } catch (HttpStatusCodeException soapEx) {
                System.out.println("Pago rechazado por el banco mock.");
                estadoPago = "RECHAZADO";
            } catch (Exception soapEx) {
                System.out.println("Error de conexión SOAP: " + soapEx.getMessage());
                estadoPago = "RECHAZADO";
            }

            // 4. Guardar orden de todas formas para dejar registro legal (aprobada o rechazada)
            String codigoCompra = "ORD-" + ((int) (Math.random() * 900000 + 100000));
            String productosDetalleJson = objectMapper.writeValueAsString(validatedItems);

            Orden orden = new Orden(
                    request.getUsuarioId(),
                    0L, // ID de producto general en 0 para compras agrupadas
                    cantidadTotal,
                    montoTotal,
                    estadoPago,
                    codigoCompra,
                    productosDetalleJson
            );

            Orden guardada = ordenRepository.save(orden);

            // Mapear respuesta
            String fechaStr = guardada.getFechaCreacion() != null
                    ? guardada.getFechaCreacion().format(DateTimeFormatter.ISO_DATE_TIME)
                    : DateTimeFormatter.ISO_DATE_TIME.format(java.time.LocalDateTime.now());

            OrdenResponse.OrdenDetail detail = new OrdenResponse.OrdenDetail(
                    guardada.getId(),
                    guardada.getCodigoCompra(),
                    guardada.getCantidad(),
                    guardada.getTotal(),
                    fechaStr,
                    validatedItems
            );

            return ResponseEntity.status(HttpStatus.CREATED).body(new OrdenResponse(
                    "Orden procesada con estado: " + estadoPago,
                    detail,
                    codigoCompra,
                    montoTotal,
                    estadoPago
            ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error en el proceso de la orden", "details", e.getMessage()));
        }
    }

    /**
     * GET /ordenes
     * Retorna todas las órdenes del sistema ordenadas por ID de forma descendente.
     */
    @GetMapping
    public List<Orden> getOrdenes() {
        return ordenRepository.findAllByOrderByIdDesc();
    }

    /**
     * GET /ordenes/usuario/{usuarioId}
     * Retorna el historial de compras de un usuario específico.
     */
    @GetMapping("/usuario/{usuarioId}")
    public List<Orden> getOrdenesUsuario(@PathVariable Long usuarioId) {
        return ordenRepository.findByUsuarioIdOrderByIdDesc(usuarioId);
    }
}
