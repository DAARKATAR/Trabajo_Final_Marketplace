package com.marketplace.gateway.controller;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
public class GatewayController {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String uddiPath = "../registro-servicios/servicios.json";

    /**
     * Resuelve dinámicamente la URL de un microservicio desde servicios.json (UDDI)
     */
    private String getServiceUrl(String nombre) {
        try {
            File file = new File(uddiPath);
            if (!file.exists()) {
                // Si se ejecuta desde el directorio del proyecto
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
     * GET /api/servicios
     * Retorna la lista de servicios directamente del UDDI
     */
    @GetMapping("/api/servicios")
    public ResponseEntity<?> getServicios() {
        try {
            File file = new File(uddiPath);
            if (!file.exists()) {
                file = new File("registro-servicios/servicios.json");
            }
            List<Map<String, String>> servicios = objectMapper.readValue(file, List.class);
            return ResponseEntity.ok(servicios);
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("error", "No se pudo cargar el registro UDDI"));
        }
    }

    // ==========================================
    // PRODUCTOS SERVICE PROXY
    // ==========================================

    @GetMapping("/api/productos")
    public ResponseEntity<?> getProductos() {
        return forwardRequest("productos-service", "/productos", HttpMethod.GET, null);
    }

    @PostMapping("/api/productos")
    public ResponseEntity<?> postProductos(@RequestBody Object body) {
        return forwardRequest("productos-service", "/productos", HttpMethod.POST, body);
    }

    @PutMapping("/api/productos/{id}")
    public ResponseEntity<?> putProducto(@PathVariable String id, @RequestBody Object body) {
        return forwardRequest("productos-service", "/productos/" + id, HttpMethod.PUT, body);
    }

    @DeleteMapping("/api/productos/{id}")
    public ResponseEntity<?> deleteProducto(@PathVariable String id) {
        return forwardRequest("productos-service", "/productos/" + id, HttpMethod.DELETE, null);
    }

    // ==========================================
    // USUARIOS SERVICE PROXY
    // ==========================================

    @GetMapping("/api/usuarios")
    public ResponseEntity<?> getUsuarios() {
        return forwardRequest("usuarios-service", "/usuarios", HttpMethod.GET, null);
    }

    @PostMapping("/api/usuarios")
    public ResponseEntity<?> postUsuarios(@RequestBody Object body) {
        return forwardRequest("usuarios-service", "/usuarios", HttpMethod.POST, body);
    }

    @PostMapping("/api/usuarios/login")
    public ResponseEntity<?> loginUsuario(@RequestBody Object body) {
        return forwardRequest("usuarios-service", "/usuarios/login", HttpMethod.POST, body);
    }

    // ==========================================
    // ORDENES SERVICE PROXY
    // ==========================================

    @PostMapping("/api/ordenes")
    public ResponseEntity<?> postOrdenes(@RequestBody Object body) {
        return forwardRequest("ordenes-service", "/ordenes", HttpMethod.POST, body);
    }

    @GetMapping("/api/ordenes")
    public ResponseEntity<?> getOrdenes() {
        return forwardRequest("ordenes-service", "/ordenes", HttpMethod.GET, null);
    }

    @GetMapping("/api/ordenes/usuario/{usuarioId}")
    public ResponseEntity<?> getOrdenesUsuario(@PathVariable String usuarioId) {
        return forwardRequest("ordenes-service", "/ordenes/usuario/" + usuarioId, HttpMethod.GET, null);
    }

    // ==========================================
    // AUXILIAR PROXY METHOD
    // ==========================================

    private ResponseEntity<?> forwardRequest(String serviceName, String path, HttpMethod method, Object body) {
        String baseUrl = getServiceUrl(serviceName);
        if (baseUrl == null) {
            return ResponseEntity.status(500).body(Map.of("error", "Servicio " + serviceName + " no disponible"));
        }

        String targetUrl = baseUrl + path;
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Object> entity = new HttpEntity<>(body, headers);

        try {
            return restTemplate.exchange(targetUrl, method, entity, Object.class);
        } catch (HttpStatusCodeException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Error al comunicar con " + serviceName, "details", e.getMessage()));
        }
    }
}
