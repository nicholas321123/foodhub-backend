const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Listar todos os restaurantes (para o sidebar)
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT r.*
      FROM restaurantes r
      WHERE r.status = 'aberto' AND r.deleted_at IS NULL
      ORDER BY r.nome ASC
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar restaurantes.' });
  }
});

// Buscar detalhes de um restaurante específico
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const [restaurant] = await pool.query(`
      SELECT r.*
      FROM restaurantes r 
      WHERE r.id = ? AND r.deleted_at IS NULL
    `, [id]);
    
    if (restaurant.length === 0) {
      return res.status(404).json({ error: 'Restaurante não encontrado.' });
    }

    const [products] = await pool.query(`
      SELECT p.*, c.nome as categoria_nome 
      FROM produtos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.restaurante_id = ? AND p.ativo = 1
    `, [id]);

    res.json({
      ...restaurant[0],
      products
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar detalhes do restaurante.' });
  }
});

module.exports = router;
