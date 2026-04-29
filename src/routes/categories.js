const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Listar todas as categorias
router.get('/', async (req, res) => {
  try {
    const { restaurante_id } = req.query;
    let query = 'SELECT * FROM categorias';
    const params = [];

    if (restaurante_id) {
      query += ' WHERE restaurante_id = ?';
      params.push(restaurante_id);
    }

    query += ' ORDER BY ordem ASC, nome ASC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar categorias.' });
  }
});

module.exports = router;
