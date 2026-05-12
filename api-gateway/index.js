const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

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

app.get('/api/servicios', (req, res) => {
  res.json(servicios);
});

app.get('/api/productos', async (req, res) => {
  const url = getServiceUrl('productos-service');
  if (!url) return res.status(500).json({ error: "Servicio no disponible" });
  try {
    const { data } = await axios.get(`${url}/productos`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Error al comunicar con Productos Service" });
  }
});

app.post('/api/usuarios', async (req, res) => {
  const url = getServiceUrl('usuarios-service');
  if (!url) return res.status(500).json({ error: "Servicio no disponible" });
  try {
    const { data } = await axios.post(`${url}/usuarios`, req.body);
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: "Error al comunicar con Usuarios Service" });
  }
});

app.post('/api/ordenes', async (req, res) => {
  const url = getServiceUrl('ordenes-service');
  if (!url) return res.status(500).json({ error: "Servicio no disponible" });
  try {
    const { data } = await axios.post(`${url}/ordenes`, req.body);
    res.status(201).json(data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: "Error al comunicar con Ordenes Service" });
    }
  }
});

app.listen(port, () => {
  console.log(`API Gateway corriendo en http://localhost:${port}`);
});
