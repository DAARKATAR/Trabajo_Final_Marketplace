const axios = require('axios');

async function runTests() {
  try {
    console.log("=== Probando API Gateway ===");
    
    // 1. Obtener productos
    console.log("1. Obteniendo productos (GET /api/productos)");
    const productos = await axios.get('http://localhost:3000/api/productos');
    console.log(productos.data);
    
    // 2. Obtener usuarios directamente (para ver que hay uno)
    console.log("2. Obteniendo usuarios (GET http://localhost:3001/usuarios)");
    const usuarios = await axios.get('http://localhost:3001/usuarios');
    console.log(usuarios.data);

    // 3. Crear orden (flujo completo)
    console.log("3. Creando orden (POST /api/ordenes)");
    const ordenRes = await axios.post('http://localhost:3000/api/ordenes', {
      usuarioId: 1,
      productoId: 1,
      cantidad: 2
    });
    console.log("Respuesta de Ordenes:");
    console.log(ordenRes.data);
    
    console.log("=== Pruebas Finalizadas Exitosamente ===");
  } catch (error) {
    console.error("Error en las pruebas:", error.response ? error.response.data : error.message);
  }
}

runTests();
