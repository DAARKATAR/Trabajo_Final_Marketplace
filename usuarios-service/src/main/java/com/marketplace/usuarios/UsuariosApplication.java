package com.marketplace.usuarios;

import com.marketplace.usuarios.entity.Usuario;
import com.marketplace.usuarios.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class UsuariosApplication {
    public static void main(String[] args) {
        SpringApplication.run(UsuariosApplication.class, args);
    }

    @Bean
    public CommandLineRunner initDatabase(UsuarioRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                Usuario user1 = new Usuario("Laura Pérez", "laura@email.com", "123456");
                Usuario admin = new Usuario("AdminMARK", "admin@marketplace.com", "Market2026*");
                repository.save(user1);
                repository.save(admin);
                System.out.println("[Usuarios DB - Java] Datos de prueba insertados (Laura Pérez, AdminMARK).");
            } else {
                if (repository.findByNombre("AdminMARK").isEmpty()) {
                    Usuario admin = new Usuario("AdminMARK", "admin@marketplace.com", "Market2026*");
                    repository.save(admin);
                    System.out.println("[Usuarios DB - Java] AdminMARK insertado en la base de datos.");
                }
            }
        };
    }
}
