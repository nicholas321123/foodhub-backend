const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Listar todos os restaurantes (com suporte a busca)
router.get('/', async (req, res) => {
  try {
    const { q, admin } = req.query;
    let query = `
      SELECT r.*
      FROM restaurantes r
      WHERE r.deleted_at IS NULL
    `;
    const params = [];

    if (!admin) {
      query += ` AND r.status = 'aberto'`;
    }

    if (q) {
      query += ` AND LOWER(r.nome) LIKE LOWER(?)`;
      params.push(`%${q}%`);
    }

    query += ` ORDER BY r.nome ASC`;

    const [rows] = await pool.query(query, params);
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

// Criar restaurante
router.post('/', async (req, res) => {
  const { nome, cnpj, telefone, endereco, logo_url, tempo_estimado_entrega, status } = req.body;
  try {
    const [result] = await pool.query(`
      INSERT INTO restaurantes (nome, cnpj, telefone, endereco, logo_url, tempo_estimado_entrega, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [nome, cnpj, telefone, endereco, logo_url, tempo_estimado_entrega, status || 'aberto']);
    res.status(201).json({ id: result.insertId, message: 'Restaurante criado com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar restaurante.' });
  }
});

// Editar restaurante
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, cnpj, telefone, endereco, logo_url, tempo_estimado_entrega, status } = req.body;
  try {
    await pool.query(`
      UPDATE restaurantes 
      SET nome=?, cnpj=?, telefone=?, endereco=?, logo_url=?, tempo_estimado_entrega=?, status=?
      WHERE id = ? AND deleted_at IS NULL
    `, [nome, cnpj, telefone, endereco, logo_url, tempo_estimado_entrega, status, id]);
    res.json({ message: 'Restaurante atualizado com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar restaurante.' });
  }
});

// Deletar restaurante (soft delete)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`UPDATE restaurantes SET deleted_at = NOW() WHERE id = ?`, [id]);
    res.json({ message: 'Restaurante excluído com sucesso.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao excluir restaurante.' });
  }
});

module.exports = router;
