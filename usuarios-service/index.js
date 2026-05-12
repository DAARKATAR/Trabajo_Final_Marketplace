const express = require('express');
const app = express();
const port = 3001;

app.use(express.json());

let usuarios = [
  { id: 1, nombre: "Laura Pérez", correo: "laura@email.com" }
];
let nextId = 2;

app.get('/usuarios', (req, res) => {
  res.json(usuarios);
});

app.get('/usuarios/:id', (req, res) => {
  const user = usuarios.find(u => u.id === parseInt(req.params.id));
  if (user) res.json(user);
  else res.status(404).json({ error: "Usuario no encontrado" });
});

app.post('/usuarios', (req, res) => {
  const nuevoUsuario = {
    id: nextId++,
    nombre: req.body.nombre,
    correo: req.body.correo
  };
  usuarios.push(nuevoUsuario);
  res.status(201).json(nuevoUsuario);
});

app.put('/usuarios/:id', (req, res) => {
  const index = usuarios.findIndex(u => u.id === parseInt(req.params.id));
  if (index !== -1) {
    usuarios[index] = { ...usuarios[index], ...req.body, id: usuarios[index].id };
    res.json(usuarios[index]);
  } else {
    res.status(404).json({ error: "Usuario no encontrado" });
  }
});

app.delete('/usuarios/:id', (req, res) => {
  const index = usuarios.findIndex(u => u.id === parseInt(req.params.id));
  if (index !== -1) {
    const deleted = usuarios.splice(index, 1);
    res.json(deleted[0]);
  } else {
    res.status(404).json({ error: "Usuario no encontrado" });
  }
});

app.listen(port, () => {
  console.log(`Usuarios Service corriendo en http://localhost:${port}`);
});
