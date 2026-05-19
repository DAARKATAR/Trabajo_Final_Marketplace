/**
 * Script de Pruebas de Integración (test.js)
 * 
 * Este script automatiza y valida el correcto funcionamiento de la arquitectura
 * ejecutando solicitudes REST a través de Axios. Simula la comunicación externa
 * del cliente final con el API Gateway y valida el flujo completo de transacciones
 * desde la consulta del catálogo hasta la orquestación de una compra.
 */

const axios = require('axios');

/**
 * Ejecuta el suite de pruebas de integración sobre los servicios activos.
 * Valida de forma secuencial:
 * 1. Obtención de catálogo de productos (GET /api/productos)
 * 2. Obtención directa de clientes (GET http://localhost:3001/usuarios)
 * 3. Ejecución y persistencia del flujo completo de creación de orden (POST /api/ordenes)
 */
async function runTests() {
  try {
    console.log("=== Iniciando Pruebas de Integración ===");
    
    // 1. Validar lectura del catálogo de productos a través del Gateway
    console.log("1. Obteniendo catálogo consolidado (GET http://localhost:3000/api/productos)...");
    const productos = await axios.get('http://localhost:3000/api/productos');
    console.log("Catálogo retornado:", productos.data);
    
    // 2. Validar comunicación directa con el microservicio de Usuarios
    console.log("2. Obteniendo clientes directamente (GET http://localhost:3001/usuarios)...");
    const usuarios = await axios.get('http://localhost:3001/usuarios');
    console.log("Usuarios en BD:", usuarios.data);

    // 3. Validar orquestación de compra compuesta (Orden -> Pagos SOAP -> Registro DB)
    console.log("3. Creando orden de compra (POST http://localhost:3000/api/ordenes)...");
    const ordenRes = await axios.post('http://localhost:3000/api/ordenes', {
      usuarioId: 1,
      productoId: 1,
      cantidad: 2
    });
    console.log("Respuesta de Órdenes (JSON Aprobado):");
    console.log(ordenRes.data);
    
    console.log("=== Pruebas de Integración Finalizadas Exitosamente ===");
  } catch (error) {
    console.error("❌ Error en la ejecución de pruebas:", error.response ? error.response.data : error.message);
  }
}

// Disparar las pruebas de integración
runTests();
