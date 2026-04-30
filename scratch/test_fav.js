const pool = require('../src/config/database');
require('dotenv').config();

async function testFavorite() {
  try {
    // Pega o primeiro usuário e o primeiro produto
    const [users] = await pool.query('SELECT id FROM usuarios LIMIT 1');
    const [prods] = await pool.query('SELECT id FROM produtos LIMIT 1');
    
    if (users.length && prods.length) {
      const userId = users[0].id;
      const prodId = prods[0].id;
      
      console.log(`Favoritando produto ${prodId} para usuário ${userId}...`);
      await pool.query('INSERT IGNORE INTO favoritos (usuario_id, produto_id) VALUES (?, ?)', [userId, prodId]);
      
      const [favs] = await pool.query('SELECT * FROM favoritos');
      console.log('Favoritos atuais:', favs);
    }
  } catch (error) {
    console.error('Erro no teste:', error);
  } finally {
    process.exit();
  }
}

testFavorite();
