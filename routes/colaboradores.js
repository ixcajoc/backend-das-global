// Rutas para gestión de colaboradores
const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

/**
 * PUT /api/colaboradores/:id
 * Edita un colaborador.
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, cui, CUI } = req.body;
  const cuiValor = cui ?? CUI ?? null;
  try {
    const result = await pool.query(
      `UPDATE colaborador
         SET nombre = COALESCE($1, nombre),
             cui = COALESCE($2, cui)
       WHERE id = $3
       RETURNING *`,
      [nombre ?? null, cuiValor, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Colaborador no encontrado.' });
    }
    res.json({ mensaje: 'Colaborador actualizado correctamente.', colaborador: result.rows[0] });
  } catch (err) {
    console.error('Error en PUT /colaboradores/:id:', err.message);
    res.status(500).json({ error: 'Error al actualizar el colaborador.', detalle: err.message });
  }
});

/**
 * DELETE /api/colaboradores/:id
 * Elimina un colaborador.
 */
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM colaborador WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Colaborador no encontrado.' });
    }
    res.json({ mensaje: 'Colaborador eliminado correctamente.' });
  } catch (err) {
    console.error('Error en DELETE /colaboradores/:id:', err.message);
    res.status(500).json({ error: 'Error al eliminar el colaborador.', detalle: err.message });
  }
});

module.exports = router;
