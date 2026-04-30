const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const adminAuth = require('../middlewares/adminAuth');

// Função auxiliar para tratar IDs vazios
const parseId = (id) => (id === '' || id === undefined || id === null) ? null : id;

// Buscar produtos por nome (Fuzzy Search)
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);
    const searchTerm = `%${q}%`;
    const exactTerm = q;
    const query = `
      SELECT p.*, r.nome as restaurante_nome, r.tempo_estimado_entrega, c.nome as categoria_nome
      FROM produtos p
      JOIN restaurantes r ON p.restaurante_id = r.id
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.ativo = 1 AND r.status = 'aberto' AND r.deleted_at IS NULL
      AND (LOWER(p.nome) LIKE LOWER(?) OR LOWER(p.descricao) LIKE LOWER(?) OR SOUNDEX(p.nome) = SOUNDEX(?))
      ORDER BY CASE WHEN LOWER(p.nome) LIKE LOWER(?) THEN 1 ELSE 2 END, p.preco ASC
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
      SELECT p.*, r.nome as restaurante_nome, r.tempo_estimado_entrega, c.nome as categoria_nome
      FROM produtos p
      JOIN restaurantes r ON p.restaurante_id = r.id
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE r.deleted_at IS NULL
    `;
    const queryParams = [];
    if (!admin) query += ` AND p.ativo = 1 AND r.status = 'aberto'`;
    if (categoria_id) { query += ` AND p.categoria_id = ?`; queryParams.push(categoria_id); }
    if (restaurante_id) { query += ` AND p.restaurante_id = ?`; queryParams.push(restaurante_id); }
    query += admin ? ` ORDER BY p.id DESC` : ` ORDER BY RAND()`;

    const [products] = await pool.query(query, queryParams);

    // Buscar opções para cada produto
    const [options] = await pool.query('SELECT * FROM produto_opcoes');
    const productsWithOpts = products.map(p => ({
      ...p,
      opcoes: options.filter(opt => opt.produto_id === p.id)
    }));

    res.json(productsWithOpts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar produtos.' });
  }
});

// Criar produto
router.post('/', adminAuth, async (req, res) => {
  const { restaurante_id, categoria_id, nome, descricao, preco, imagem_url, ativo, opcoes } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const [result] = await connection.query(`
      INSERT INTO produtos (restaurante_id, categoria_id, nome, descricao, preco, imagem_url, ativo)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      parseId(restaurante_id), 
      parseId(categoria_id), 
      nome, 
      descricao || '', 
      preco || 0, 
      imagem_url || '', 
      ativo === undefined ? 1 : ativo
    ]);
    
    const produtoId = result.insertId;

    if (opcoes && Array.isArray(opcoes)) {
      for (const opt of opcoes) {
        if (opt.label) {
          await connection.query('INSERT INTO produto_opcoes (produto_id, label, preco) VALUES (?, ?, ?)', 
            [produtoId, opt.label, opt.preco || 0]);
        }
      }
    }

    await connection.commit();
    res.status(201).json({ id: produtoId, message: 'Produto criado com sucesso.' });
  } catch (error) {
    await connection.rollback();
    console.error('ERRO AO CRIAR PRODUTO:', error);
    res.status(500).json({ error: 'Erro ao criar produto: ' + error.message });
  } finally {
    connection.release();
  }
});

// Editar produto
router.put('/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { restaurante_id, categoria_id, nome, descricao, preco, imagem_url, ativo, opcoes } = req.body;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(`
      UPDATE produtos 
      SET restaurante_id=?, categoria_id=?, nome=?, descricao=?, preco=?, imagem_url=?, ativo=?
      WHERE id = ?
    `, [
      parseId(restaurante_id), 
      parseId(categoria_id), 
      nome, 
      descricao || '', 
      preco || 0, 
      imagem_url || '', 
      ativo, 
      id
    ]);

    await connection.query('DELETE FROM produto_opcoes WHERE produto_id = ?', [id]);
    if (opcoes && Array.isArray(opcoes)) {
      for (const opt of opcoes) {
        if (opt.label) {
          await connection.query('INSERT INTO produto_opcoes (produto_id, label, preco) VALUES (?, ?, ?)', 
            [id, opt.label, opt.preco || 0]);
        }
      }
    }

    await connection.commit();
    res.json({ message: 'Produto atualizado com sucesso.' });
  } catch (error) {
    await connection.rollback();
    console.error('ERRO AO ATUALIZAR PRODUTO:', error);
    res.status(500).json({ error: 'Erro ao atualizar produto: ' + error.message });
  } finally {
    connection.release();
  }
});

// Deletar produto
router.delete('/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query('DELETE FROM produto_opcoes WHERE produto_id = ?', [id]);
    const [result] = await connection.query('DELETE FROM produtos WHERE id = ?', [id]);
    await connection.commit();
    res.json({ message: 'Produto excluído com sucesso.' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ error: 'Erro ao excluir produto.' });
  } finally {
    connection.release();
  }
});

module.exports = router;
