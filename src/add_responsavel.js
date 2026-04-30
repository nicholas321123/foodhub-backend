const pool = require('./config/database');

async function addCol() {
  console.log('🛠️ Adicionando coluna "responsavel" no Easypanel...');
  try {
    await pool.query('ALTER TABLE restaurantes ADD COLUMN responsavel VARCHAR(150) AFTER nome');
    console.log('✅ Coluna "responsavel" adicionada com sucesso!');
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_COLUMN_NAME') {
      console.log('ℹ️ Coluna "responsavel" já existe.');
      process.exit(0);
    }
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

addCol();
