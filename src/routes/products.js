const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Buscar produtos por nome (Fuzzy Search)
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    
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

// Listar todos os produtos
router.get('/', async (req, res) => {
  try {
    const { categoria_id, restaurante_id, admin } = req.query;
    
    let query = `
      SELECT 
        p.*, 
        r.nome as restaurante_nome,
        r.tempo_estimado_entrega,
        c.nome as categoria_nome
      FROM produtos p
      JOIN restaurantes r ON p.restaurante_id = r.id
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE r.deleted_at IS NULL
    `;
    
    const queryParams = [];

    if (!admin) {
      query += ` AND p.ativo = 1 AND r.status = 'aberto'`;
    }
    
    if (categoria_id) {
      query += ` AND p.categoria_id = ?`;
      queryParams.push(categoria_id);
    }

    if (restaurante_id) {
      query += ` AND p.restaurante_id = ?`;
      queryParams.push(restaurante_id);
    }
    
    if (!admin) {
      query += ` ORDER BY RAND()`;
    } else {
      query += ` ORDER BY p.id DESC`;
    }
    
    const [rows] = await pool.query(query, queryParams);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar produtos.' });
  }
});

// Criar produto
router.post('/', async (req, res) => {
  const { restaurante_id, categoria_id, nome, descricao, preco, imagem_url, ativo } = req.body;
  try {
    const [result] = await pool.query(`
      INSERT INTO produtos (restaurante_id, categoria_id, nome, descricao, preco, imagem_url, ativo)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [restaurante_id, categoria_id, nome, descricao, preco, imagem_url, ativo === undefined ? 1 : ativo]);
    res.status(201).json({ id: result.insertId, message: 'Produto criado com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar produto.' });
  }
});

// Editar produto
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { restaurante_id, categoria_id, nome, descricao, preco, imagem_url, ativo } = req.body;
  try {
    await pool.query(`
      UPDATE produtos 
      SET restaurante_id=?, categoria_id=?, nome=?, descricao=?, preco=?, imagem_url=?, ativo=?
      WHERE id = ?
    `, [restaurante_id, categoria_id, nome, descricao, preco, imagem_url, ativo, id]);
    res.json({ message: 'Produto atualizado com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar produto.' });
  }
});

// Deletar produto (inativar)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`UPDATE produtos SET ativo = 0 WHERE id = ?`, [id]);
    res.json({ message: 'Produto desativado com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao desativar produto.' });
  }
});

module.exports = router;
