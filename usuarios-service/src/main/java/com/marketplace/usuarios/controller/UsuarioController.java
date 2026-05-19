package com.marketplace.usuarios.controller;

import com.marketplace.usuarios.dto.LoginRequest;
import com.marketplace.usuarios.entity.Usuario;
import com.marketplace.usuarios.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    /**
     * GET /usuarios
     * Lista todos los usuarios excepto AdminMARK y admin@marketplace.com por seguridad.
     */
    @GetMapping
    public List<Usuario> getUsuariosPublicos() {
        return usuarioRepository.findByNombreNotAndCorreoNot("AdminMARK", "admin@marketplace.com");
    }

    /**
     * GET /usuarios/{id}
     * Retorna un usuario por su ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getUsuarioPorId(@PathVariable Long id) {
        Optional<Usuario> user = usuarioRepository.findById(id);
        if (user.isPresent()) {
            return ResponseEntity.ok(user.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Usuario no encontrado"));
        }
    }

    /**
     * POST /usuarios
     * Crea un nuevo usuario. Contraseña por defecto: "123456" si no se provee.
     */
    @PostMapping
    public ResponseEntity<?> registrarUsuario(@RequestBody Usuario usuario) {
        if (usuario.getNombre() == null || usuario.getCorreo() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Faltan campos obligatorios (nombre, correo)"));
        }
        if (usuario.getContrasena() == null || usuario.getContrasena().trim().isEmpty()) {
            usuario.setContrasena("123456");
        }
        try {
            Usuario guardado = usuarioRepository.save(usuario);
            return ResponseEntity.status(HttpStatus.CREATED).body(guardado);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al crear usuario en la base de datos", "details", e.getMessage()));
        }
    }

    /**
     * POST /usuarios/login
     * Autentica a un cliente o admin mediante su correo (o nombre) y contraseña.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.getCorreo() == null || request.getContrasena() == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Faltan parámetros (correo, contrasena)"));
        }
        Optional<Usuario> user = usuarioRepository.findByUsernameAndPassword(request.getCorreo(), request.getContrasena());
        if (user.isPresent()) {
            return ResponseEntity.ok(user.get());
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Credenciales incorrectas"));
        }
    }

    /**
     * PUT /usuarios/{id}
     * Actualiza nombre y/o correo de un usuario existente.
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarUsuario(@PathVariable Long id, @RequestBody Usuario reqBody) {
        Optional<Usuario> opt = usuarioRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Usuario no encontrado"));
        }

        Usuario actual = opt.get();
        if (reqBody.getNombre() != null) {
            actual.setNombre(reqBody.getNombre());
        }
        if (reqBody.getCorreo() != null) {
            actual.setCorreo(reqBody.getCorreo());
        }

        try {
            Usuario guardado = usuarioRepository.save(actual);
            return ResponseEntity.ok(guardado);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error al actualizar usuario en la base de datos", "details", e.getMessage()));
        }
    }

    /**
     * DELETE /usuarios/{id}
     * Elimina un usuario.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarUsuario(@PathVariable Long id) {
        Optional<Usuario> opt = usuarioRepository.findById(id);
        if (opt.isPresent()) {
            usuarioRepository.deleteById(id);
            return ResponseEntity.ok(opt.get());
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Usuario no encontrado"));
        }
    }
}
