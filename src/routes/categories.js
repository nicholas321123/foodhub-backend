const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const adminAuth = require('../middlewares/adminAuth');

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

// Criar categoria (Apenas Admin)
router.post('/', adminAuth, async (req, res) => {
  const { nome, restaurante_id, ordem } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO categorias (nome, restaurante_id, ordem) VALUES (?, ?, ?)',
      [nome, restaurante_id || null, ordem || 0]
    );
    res.status(201).json({ id: result.insertId, message: 'Categoria criada com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar categoria.' });
  }
});

// Editar categoria (Apenas Admin)
router.put('/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { nome, restaurante_id, ordem } = req.body;
  try {
    await pool.query(
      'UPDATE categorias SET nome = ?, restaurante_id = ?, ordem = ? WHERE id = ?',
      [nome, restaurante_id || null, ordem || 0, id]
    );
    res.json({ message: 'Categoria atualizada com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar categoria.' });
  }
});

// Deletar categoria (Apenas Admin)
router.delete('/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Desvincular produtos desta categoria (set categoria_id to NULL)
    await connection.query('UPDATE produtos SET categoria_id = NULL WHERE categoria_id = ?', [id]);

    // 2. Excluir a categoria
    await connection.query('DELETE FROM categorias WHERE id = ?', [id]);

    await connection.commit();
    res.json({ message: 'Categoria excluída com sucesso.' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ error: 'Erro ao excluir categoria. Verifique se não há dependências.' });
  } finally {
    connection.release();
  }
});

module.exports = router;
