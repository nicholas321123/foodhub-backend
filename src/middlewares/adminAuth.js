const jwt = require('jsonwebtoken');

const adminAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    // Verifica se o usuário é admin (tipo === 'admin')
    if (decoded.tipo !== 'admin') {
      return res.status(403).json({ error: 'Acesso proibido. Apenas administradores podem realizar esta ação.' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido.' });
  }
};

module.exports = adminAuth;
