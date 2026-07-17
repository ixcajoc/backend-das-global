// Punto de entrada del servidor
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const empresasRoutes = require('./routes/empresas');
const sucursalesRoutes = require('./routes/sucursales');
const colaboradoresRoutes = require('./routes/colaboradores');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors()); // CORS para Angular
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Ruta de salud / bienvenida
app.get('/', (req, res) => {
  res.json({
    mensaje: 'API DAS Global funcionando correctamente.',
    endpoints: [
      'POST   /api/upload',
      'GET    /api/empresas',
      'GET    /api/sucursales',
      'PUT    /api/sucursales/:id',
      'DELETE /api/sucursales/:id',
      'POST   /api/sucursales/:id/colaboradores',
      'PUT    /api/colaboradores/:id',
      'DELETE /api/colaboradores/:id',
    ],
  });
});

// Registro de rutas
app.use('/api', empresasRoutes); // /api/upload y /api/empresas
app.use('/api/sucursales', sucursalesRoutes); // /api/sucursales...
app.use('/api/colaboradores', colaboradoresRoutes); // /api/colaboradores...

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error('Error no controlado:', err.message);
  res.status(500).json({ error: 'Error interno del servidor.', detalle: err.message });
});

app.listen(PORT, () => {
  console.log(`Servidor DAS Global escuchando en http://localhost:${PORT}`);
});

module.exports = app;
