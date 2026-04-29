const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");

const router = express.Router();
const saltRounds = 10;

// Rota de registro de usuário
router.post("/register", async (req, res) => {
  // Aceitando chaves antigas e novas para evitar quebra imediata no frontend
  const { email, password, full_name, nome, phone, telefone } = req.body;
  const finalName = nome || full_name;
  const finalPhone = telefone || phone;

  try {
    // Verifica se o usuário já existe
    const [existingUser] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [email]);

    if (existingUser.length > 0) {
      return res.status(400).json({ error: "E-mail já cadastrado." });
    }

    // Criptografa a senha
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insere o usuário no banco de dados
    await pool.query(
      "INSERT INTO usuarios (email, senha_hash, nome, telefone, tipo) VALUES (?, ?, ?, ?, 'cliente')",
      [email, hashedPassword, finalName, finalPhone]
    );

    res.status(201).json({ message: "Usuário cadastrado com sucesso!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao registrar usuário." });
  }
});

// Rota de login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Busca o usuário no banco de dados
    const [user] = await pool.query(`
      SELECT 
        id, 
        email, 
        nome,
        senha_hash,
        tipo
      FROM usuarios
      WHERE email = ? AND deleted_at IS NULL
    `, [email]);

    if (user.length === 0) {
      return res.status(400).json({ error: "E-mail ou senha inválidos." });
    }

    const userData = user[0];

    // Verifica se a senha está correta
    const validPassword = await bcrypt.compare(password, userData.senha_hash);

    if (!validPassword) {
      return res.status(400).json({ error: "E-mail ou senha inválidos." });
    }

    // Gera o token JWT
    const token = jwt.sign(
      { id: userData.id, email: userData.email, tipo: userData.tipo },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: "1h" }
    );

    // Retorna tudo que o frontend precisa
    res.json({
      token,
      user: {
        id: userData.id,
        email: userData.email,
        nome: userData.nome,
        tipo: userData.tipo
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao fazer login." });
  }
});

// Rota de redefinição de senha (sem autenticação)
router.post("/reset-password", async (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;

  if (!email || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: "Preencha todos os campos." });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: "As senhas não coincidem." });
  }

  try {
    // Verifica se o usuário existe
    const [user] = await pool.query("SELECT * FROM usuarios WHERE email = ? AND deleted_at IS NULL", [email]);

    // Não expõe se existe ou não
    if (user.length === 0) {
      return res.status(200).json({ message: "Se o e-mail existir, a senha será redefinida." });
    }

    // Criptografa a nova senha
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Atualiza a senha no banco
    await pool.query(
      "UPDATE usuarios SET senha_hash = ? WHERE email = ?",
      [hashedPassword, email]
    );

    res.status(200).json({ message: "Se o e-mail existir, a senha será redefinida." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao redefinir senha." });
  }
});

module.exports = router;
