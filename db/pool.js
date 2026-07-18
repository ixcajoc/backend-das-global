// Configuración del pool de conexiones a PostgreSQL
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'das_global',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'user',
});


pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err);
});

module.exports = pool;
