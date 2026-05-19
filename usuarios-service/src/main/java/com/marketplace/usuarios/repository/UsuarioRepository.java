package com.marketplace.usuarios.repository;

import com.marketplace.usuarios.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    // Obtener todos los usuarios que no sean AdminMARK ni admin@marketplace.com (para la lista pública)
    List<Usuario> findByNombreNotAndCorreoNot(String nombre, String correo);

    Optional<Usuario> findByNombre(String nombre);

    // Permite login por correo o por nombre (AdminMARK) con su contraseña
    @Query("SELECT u FROM Usuario u WHERE (u.correo = :username OR u.nombre = :username) AND u.contrasena = :password")
    Optional<Usuario> findByUsernameAndPassword(@Param("username") String username, @Param("password") String password);
}
