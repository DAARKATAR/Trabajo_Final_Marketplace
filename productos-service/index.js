const express = require('express');
const app = express();
const port = 3002;

app.use(express.json());

let productos = [
  { id: 1, nombre: "Mouse inalámbrico", precio: 55000 },
  { id: 2, nombre: "Teclado mecánico", precio: 120000 }
];
let nextId = 3;

app.get('/productos', (req, res) => {
  res.json(productos);
});

app.get('/productos/:id', (req, res) => {
  const producto = productos.find(p => p.id === parseInt(req.params.id));
  if (producto) res.json(producto);
  else res.status(404).json({ error: "Producto no encontrado" });
});

app.post('/productos', (req, res) => {
  const nuevoProducto = {
    id: nextId++,
    nombre: req.body.nombre,
    precio: req.body.precio
  };
  productos.push(nuevoProducto);
  res.status(201).json(nuevoProducto);
});

app.listen(port, () => {
  console.log(`Productos Service corriendo en http://localhost:${port}`);
});
