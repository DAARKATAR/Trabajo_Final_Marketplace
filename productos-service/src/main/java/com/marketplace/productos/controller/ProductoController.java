package com.marketplace.productos.controller;

import com.marketplace.productos.entity.Producto;
import com.marketplace.productos.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/productos")
public class ProductoController {

    @Autowired
    private ProductoRepository productoRepository;

    /**
     * GET /productos
     * Retorna todos los productos ordenados por ID de forma ascendente.
     */
    @GetMapping
    public List<Producto> getProductos() {
        return productoRepository.findAll();
    }

    /**
     * GET /productos/{id}
     * Retorna un producto específico por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getProductoPorId(@PathVariable Long id) {
        Optional<Producto> opt = productoRepository.findById(id);
        if (opt.isPresent()) {
            return ResponseEntity.ok(opt.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Producto no encontrado"));
        }
    }

    /**
     * POST /productos
     * Inserta un nuevo producto al catálogo (CRUD Admin)
     */
    @PostMapping
    public ResponseEntity<?> registrarProducto(@RequestBody Producto producto) {
        if (producto.getNombre() == null || producto.getPrecio() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Faltan campos obligatorios (nombre, precio)"));
        }
        try {
            Producto guardado = productoRepository.save(producto);
            return ResponseEntity.status(HttpStatus.CREATED).body(guardado);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al crear producto en la base de datos", "details", e.getMessage()));
        }
    }

    /**
     * PUT /productos/{id}
     * Actualiza el nombre o precio de un producto
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarProducto(@PathVariable Long id, @RequestBody Producto reqBody) {
        Optional<Producto> opt = productoRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Producto no encontrado"));
        }

        Producto actual = opt.get();
        if (reqBody.getNombre() != null) {
            actual.setNombre(reqBody.getNombre());
        }
        if (reqBody.getPrecio() != null) {
            actual.setPrecio(reqBody.getPrecio());
        }

        try {
            Producto guardado = productoRepository.save(actual);
            return ResponseEntity.ok(guardado);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al actualizar producto en la base de datos", "details", e.getMessage()));
        }
    }

    /**
     * DELETE /productos/{id}
     * Remueve un producto del catálogo
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarProducto(@PathVariable Long id) {
        Optional<Producto> opt = productoRepository.findById(id);
        if (opt.isPresent()) {
            productoRepository.deleteById(id);
            return ResponseEntity.ok(opt.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Producto no encontrado"));
        }
    }
}
