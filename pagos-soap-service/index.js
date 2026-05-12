const express = require('express');
const bodyParser = require('body-parser');
require('body-parser-xml')(bodyParser);

const app = express();
const port = 3004;

app.use(bodyParser.xml({
  xmlParseOptions: {
    explicitArray: false
  }
}));

app.post('/pagos', (req, res) => {
  const pagoData = req.body && req.body.pago;
  
  if (!pagoData) {
    res.set('Content-Type', 'text/xml');
    return res.status(400).send(`
      <respuesta>
        <estado>RECHAZADO</estado>
        <codigo>400</codigo>
        <mensaje>XML Invalido</mensaje>
      </respuesta>
    `);
  }

  const { usuarioId, monto } = pagoData;
  console.log(`[SOAP Bank] Pago procesado. Usuario: ${usuarioId}, Monto: ${monto}`);

  const respuestaXML = `
<respuesta>
  <estado>APROBADO</estado>
  <codigo>200</codigo>
</respuesta>`.trim();

  res.set('Content-Type', 'text/xml');
  res.send(respuestaXML);
});

app.listen(port, () => {
  console.log(`Pagos SOAP Service corriendo en http://localhost:${port}`);
});
