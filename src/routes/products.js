const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Buscar produtos por nome (Fuzzy Search)
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    
    // Otimização: LIKE com % permite encontrar partes da palavra
    // SOUNDEX ajuda com erros de digitação
    const searchTerm = `%${q}%`;
    const exactTerm = q;
    const query = `
      SELECT 
        p.*, 
        r.nome as restaurante_nome,
        r.tempo_estimado_entrega,
        c.nome as categoria_nome
      FROM produtos p
      JOIN restaurantes r ON p.restaurante_id = r.id
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.ativo = 1 AND r.status = 'aberto' AND r.deleted_at IS NULL
      AND (
        LOWER(p.nome) LIKE LOWER(?) 
        OR LOWER(p.descricao) LIKE LOWER(?)
        OR SOUNDEX(p.nome) = SOUNDEX(?)
      )
      ORDER BY 
        CASE WHEN LOWER(p.nome) LIKE LOWER(?) THEN 1 ELSE 2 END, 
        p.preco ASC
    `;
    
    const [rows] = await pool.query(query, [searchTerm, searchTerm, exactTerm, searchTerm]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar produtos.' });
  }
});

// Listar todos os produtos (para a Home e Categorias)
router.get('/', async (req, res) => {
  try {
    const { categoria_id, restaurante_id } = req.query;
    
    let query = `
      SELECT 
        p.*, 
        r.nome as restaurante_nome,
        r.tempo_estimado_entrega,
        c.nome as categoria_nome
      FROM produtos p
      JOIN restaurantes r ON p.restaurante_id = r.id
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.ativo = 1 AND r.status = 'aberto' AND r.deleted_at IS NULL
    `;
    
    const queryParams = [];
    
    if (categoria_id) {
      query += ` AND p.categoria_id = ?`;
      queryParams.push(categoria_id);
    }

    if (restaurante_id) {
      query += ` AND p.restaurante_id = ?`;
      queryParams.push(restaurante_id);
    }
    
    query += ` ORDER BY RAND()`;
    
    const [rows] = await pool.query(query, queryParams);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar produtos.' });
  }
});

module.exports = router;
