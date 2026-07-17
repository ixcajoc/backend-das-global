// Rutas para gestión de sucursales y sus colaboradores
const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

/**
 * GET /api/sucursales
 * Lista todas las sucursales con sus colaboradores.
 */
router.get('/', async (req, res) => {
  try {
    const sucursales = (await pool.query('SELECT * FROM sucursal ORDER BY id')).rows;
    const colaboradores = (await pool.query('SELECT * FROM colaborador ORDER BY id')).rows;

    const resultado = sucursales.map((s) => ({
      ...s,
      colaboradores: colaboradores.filter((c) => c.sucursal_id === s.id),
    }));

    res.json(resultado);
  } catch (err) {
    console.error('Error en GET /sucursales:', err.message);
    res.status(500).json({ error: 'Error al obtener las sucursales.', detalle: err.message });
  }
});

/**
 * PUT /api/sucursales/:id
 * Edita una sucursal.
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, direccion, telefono } = req.body;
  try {
    const result = await pool.query(
      `UPDATE sucursal
         SET nombre = COALESCE($1, nombre),
             direccion = COALESCE($2, direccion),
             telefono = COALESCE($3, telefono)
       WHERE id = $4
       RETURNING *`,
      [nombre ?? null, direccion ?? null, telefono ?? null, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Sucursal no encontrada.' });
    }
    res.json({ mensaje: 'Sucursal actualizada correctamente.', sucursal: result.rows[0] });
  } catch (err) {
    console.error('Error en PUT /sucursales/:id:', err.message);
    res.status(500).json({ error: 'Error al actualizar la sucursal.', detalle: err.message });
  }
});

/**
 * DELETE /api/sucursales/:id
 * Elimina una sucursal y sus colaboradores (cascade por FK).
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM sucursal WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Sucursal no encontrada.' });
    }
    res.json({ mensaje: 'Sucursal y sus colaboradores eliminados correctamente.' });
  } catch (err) {
    console.error('Error en DELETE /sucursales/:id:', err.message);
    res.status(500).json({ error: 'Error al eliminar la sucursal.', detalle: err.message });
  }
});

/**
 * POST /api/sucursales/:id/colaboradores
 * Agrega un colaborador a una sucursal.
 */
router.post('/:id/colaboradores', async (req, res) => {
  const { id } = req.params;
  const { nombre, cui, CUI } = req.body;
  const cuiValor = cui ?? CUI ?? null;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre del colaborador es obligatorio.' });
  }

  try {
    // Validar que la sucursal exista
    const sucursal = await pool.query('SELECT id FROM sucursal WHERE id = $1', [id]);
    if (sucursal.rowCount === 0) {
      return res.status(404).json({ error: 'Sucursal no encontrada.' });
    }

    const result = await pool.query(
      'INSERT INTO colaborador (sucursal_id, nombre, cui) VALUES ($1, $2, $3) RETURNING *',
      [id, nombre, cuiValor]
    );
    res.status(201).json({ mensaje: 'Colaborador agregado correctamente.', colaborador: result.rows[0] });
  } catch (err) {
    console.error('Error en POST /sucursales/:id/colaboradores:', err.message);
    res.status(500).json({ error: 'Error al agregar el colaborador.', detalle: err.message });
  }
});

module.exports = router;
