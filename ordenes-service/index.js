const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3003;

app.use(express.json());

const uddiPath = path.join(__dirname, '../registro-servicios/servicios.json');
let servicios = [];
try {
  servicios = JSON.parse(fs.readFileSync(uddiPath, 'utf8'));
} catch (e) {
  console.error("No se pudo cargar el registro UDDI", e);
}

const getServiceUrl = (nombre) => {
  const s = servicios.find(srv => srv.nombre === nombre);
  return s ? s.url : null;
};

app.post('/ordenes', async (req, res) => {
  const { usuarioId, productoId, cantidad } = req.body;

  if (!usuarioId || !productoId || !cantidad) {
    return res.status(400).json({ error: "Faltan parámetros (usuarioId, productoId, cantidad)" });
  }

  const usuariosUrl = getServiceUrl('usuarios-service');
  const productosUrl = getServiceUrl('productos-service');
  const pagosUrl = getServiceUrl('pagos-soap-service');

  try {
    // 1. Validar usuario
    await axios.get(`${usuariosUrl}/usuarios/${usuarioId}`);
    
    // 2. Validar producto
    const { data: producto } = await axios.get(`${productosUrl}/productos/${productoId}`);
    
    // 3. Calcular total
    const montoTotal = producto.precio * cantidad;

    // 4. Enviar pago al servicio SOAP/XML
    const xmlPayload = `
<pago>
  <usuarioId>${usuarioId}</usuarioId>
  <monto>${montoTotal}</monto>
</pago>
    `.trim();

    const soapRes = await axios.post(`${pagosUrl}/pagos`, xmlPayload, {
      headers: { 'Content-Type': 'application/xml' }
    });

    if (soapRes.data.includes('APROBADO')) {
      res.status(201).json({
        mensaje: "Orden creada y pagada con éxito",
        orden: { usuarioId, productoId, cantidad, total: montoTotal },
        estadoPago: "APROBADO"
      });
    } else {
      res.status(400).json({ error: "Pago rechazado por el banco" });
    }

  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: "Usuario o Producto no encontrado" });
    }
    console.error(error.message);
    res.status(500).json({ error: "Error en el proceso de la orden" });
  }
});

app.listen(port, () => {
  console.log(`Ordenes Service corriendo en http://localhost:${port}`);
});
