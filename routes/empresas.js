// Rutas para carga de datos (upload) y listado de empresas
const express = require('express');
const multer = require('multer');
const pool = require('../db/pool');

const router = express.Router();

// Multer en memoria para recibir archivos JSON opcionalmente
const upload = multer({ storage: multer.memoryStorage() });

/**
 * Normaliza el payload recibido. Acepta tanto:
 *  - { "empresa": { ... } }
 *  - { ...datos de empresa directamente... }
 * Devuelve el objeto empresa o null si no es válido.
 */
function extraerEmpresa(body) {
  if (!body || typeof body !== 'object') return null;
  const empresa = body.empresa ? body.empresa : body;
  if (!empresa || typeof empresa !== 'object' || !empresa.nombre) return null;
  return empresa;
}

/**
 * POST /api/upload
 * Recibe el JSON completo (empresa -> sucursales -> colaboradores)
 * e inserta todo dentro de una transacción.
 * Acepta el JSON en el body (application/json) o como archivo (campo "file").
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  let body = req.body;

  // Si vino como archivo, parsear su contenido
  if (req.file) {
    try {
      body = JSON.parse(req.file.buffer.toString('utf8'));
    } catch (e) {
      return res.status(400).json({ error: 'El archivo no contiene un JSON válido.' });
    }
  }

  const empresa = extraerEmpresa(body);
  if (!empresa) {
    return res.status(400).json({
      error: 'JSON inválido. Se espera un objeto "empresa" con al menos un "nombre".',
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insertar empresa
    const empresaResult = await client.query(
      'INSERT INTO empresa (nombre, pais) VALUES ($1, $2) RETURNING id',
      [empresa.nombre, empresa.pais || null]
    );
    const empresaId = empresaResult.rows[0].id;

    const sucursales = Array.isArray(empresa.sucursales) ? empresa.sucursales : [];
    let totalSucursales = 0;
    let totalColaboradores = 0;

    for (const suc of sucursales) {
      const sucResult = await client.query(
        'INSERT INTO sucursal (empresa_id, nombre, direccion, telefono) VALUES ($1, $2, $3, $4) RETURNING id',
        [empresaId, suc.nombre || null, suc.direccion || null, suc.telefono || null]
      );
      const sucursalId = sucResult.rows[0].id;
      totalSucursales++;

      const colaboradores = Array.isArray(suc.colaboradores) ? suc.colaboradores : [];
      for (const col of colaboradores) {
        await client.query(
          'INSERT INTO colaborador (sucursal_id, nombre, cui) VALUES ($1, $2, $3)',
          [sucursalId, col.nombre || null, col.CUI || col.cui || null]
        );
        totalColaboradores++;
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      mensaje: 'Datos cargados correctamente.',
      empresa_id: empresaId,
      sucursales_insertadas: totalSucursales,
      colaboradores_insertados: totalColaboradores,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en /upload:', err.message);
    res.status(500).json({ error: 'Error al guardar los datos.', detalle: err.message });
  } finally {
    client.release();
  }
});

/**
 * GET /api/empresas
 * Lista todas las empresas con sus sucursales y colaboradores anidados.
 */
router.get('/empresas', async (req, res) => {
  try {
    const empresas = (await pool.query('SELECT * FROM empresa ORDER BY id')).rows;
    const sucursales = (await pool.query('SELECT * FROM sucursal ORDER BY id')).rows;
    const colaboradores = (await pool.query('SELECT * FROM colaborador ORDER BY id')).rows;

    const resultado = empresas.map((emp) => ({
      ...emp,
      sucursales: sucursales
        .filter((s) => s.empresa_id === emp.id)
        .map((s) => ({
          ...s,
          colaboradores: colaboradores.filter((c) => c.sucursal_id === s.id),
        })),
    }));

    res.json(resultado);
  } catch (err) {
    console.error('Error en GET /empresas:', err.message);
    res.status(500).json({ error: 'Error al obtener las empresas.', detalle: err.message });
  }
});

module.exports = router;
