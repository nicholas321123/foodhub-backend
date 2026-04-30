const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const jwt = require('jsonwebtoken');

// Middleware para verificar se o usuário está logado
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Não autorizado.' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido.' });
  }
};

// Listar favoritos do usuário (separados)
router.get('/', authenticate, async (req, res) => {
  try {
    const [restaurants] = await pool.query(`
      SELECT r.* 
      FROM favoritos f
      JOIN restaurantes r ON f.restaurante_id = r.id
      WHERE f.usuario_id = ? AND r.deleted_at IS NULL
    `, [req.user.id]);

    const [products] = await pool.query(`
      SELECT p.*, r.nome as restaurante_nome
      FROM favoritos f
      JOIN produtos p ON f.produto_id = p.id
      LEFT JOIN restaurantes r ON p.restaurante_id = r.id
      WHERE f.usuario_id = ?
    `, [req.user.id]);

    res.json({ restaurants, products });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar favoritos.' });
  }
});

// Adicionar aos favoritos (Restaurante ou Produto)
router.post('/', authenticate, async (req, res) => {
  const { restaurantId, productId } = req.body;
  try {
    if (restaurantId) {
      await pool.query('INSERT IGNORE INTO favoritos (usuario_id, restaurante_id) VALUES (?, ?)', [req.user.id, restaurantId]);
    } else if (productId) {
      await pool.query('INSERT IGNORE INTO favoritos (usuario_id, produto_id) VALUES (?, ?)', [req.user.id, productId]);
    }
    res.json({ message: 'Adicionado aos favoritos.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao favoritar.' });
  }
});

// Remover dos favoritos
router.delete('/', authenticate, async (req, res) => {
  const { restaurantId, productId } = req.query;
  try {
    if (restaurantId) {
      await pool.query('DELETE FROM favoritos WHERE usuario_id = ? AND restaurante_id = ?', [req.user.id, restaurantId]);
    } else if (productId) {
      await pool.query('DELETE FROM favoritos WHERE usuario_id = ? AND produto_id = ?', [req.user.id, productId]);
    }
    res.json({ message: 'Removido dos favoritos.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao remover favorito.' });
  }
});

module.exports = router;
