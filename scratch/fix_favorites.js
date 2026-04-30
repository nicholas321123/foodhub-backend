const pool = require('../src/config/database');
require('dotenv').config();

async function fixFavoritesTable() {
  console.log('🛠️ Corrigindo/Criando tabela de favoritos...');
  
  try {
    // Tenta dropar se estiver errada ou apenas garantir que os campos existam
    // Mas para garantir a integridade, vamos criar do zero se não for igual
    await pool.query(`DROP TABLE IF EXISTS favoritos`);
    
    await pool.query(`
      CREATE TABLE favoritos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id BIGINT UNSIGNED NOT NULL,
        restaurante_id BIGINT UNSIGNED DEFAULT NULL,
        produto_id BIGINT UNSIGNED DEFAULT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_fav_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        CONSTRAINT fk_fav_restaurante FOREIGN KEY (restaurante_id) REFERENCES restaurantes(id) ON DELETE CASCADE,
        CONSTRAINT fk_fav_produto FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_restaurant (usuario_id, restaurante_id),
        UNIQUE KEY unique_user_product (usuario_id, produto_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    
    console.log('✅ Tabela "favoritos" recriada com suporte a produtos!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    process.exit();
  }
}

fixFavoritesTable();
