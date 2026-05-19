package com.marketplace.productos;

import com.marketplace.productos.entity.Producto;
import com.marketplace.productos.repository.ProductoRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.math.BigDecimal;

@SpringBootApplication
public class ProductosApplication {
    public static void main(String[] args) {
        SpringApplication.run(ProductosApplication.class, args);
    }

    @Bean
    public CommandLineRunner initDatabase(ProductoRepository repository) {
        return args -> {
            if (repository.count() == 0) {
                repository.save(new Producto("Mouse inalámbrico", new BigDecimal("55000.00")));
                repository.save(new Producto("Teclado mecánico", new BigDecimal("120000.00")));
                System.out.println("[Productos DB - Java] Productos de prueba insertados.");
            }
        };
    }
}
