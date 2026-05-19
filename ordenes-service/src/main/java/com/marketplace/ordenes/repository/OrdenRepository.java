package com.marketplace.ordenes.repository;

import com.marketplace.ordenes.entity.Orden;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OrdenRepository extends JpaRepository<Orden, Long> {
    List<Orden> findByUsuarioIdOrderByIdDesc(Long usuarioId);
    List<Orden> findAllByOrderByIdDesc();
}
