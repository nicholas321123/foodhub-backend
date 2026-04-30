const pool = require('./config/database');

async function fix() {
  console.log('🛠️ Iniciando correções no banco de dados do Easypanel...');
  
  try {
    // 1. Alterar tempo_estimado_entrega para VARCHAR para aceitar intervalos como "35-45"
    await pool.query('ALTER TABLE restaurantes MODIFY COLUMN tempo_estimado_entrega VARCHAR(50)');
    console.log('✅ Coluna "tempo_estimado_entrega" alterada para VARCHAR.');

    // 2. Garantir que as colunas de URL de imagem sejam TEXT para não limitar o tamanho do link
    await pool.query('ALTER TABLE restaurantes MODIFY COLUMN logo_url TEXT');
    await pool.query('ALTER TABLE produtos MODIFY COLUMN imagem_url TEXT');
    console.log('✅ Colunas de URL de imagem ajustadas.');

    // 4. Tornar categoria_id opcional em produtos para evitar erro 500 se não houver categoria selecionada
    try {
        await pool.query('ALTER TABLE produtos MODIFY COLUMN categoria_id bigint UNSIGNED NULL');
        console.log('✅ Coluna "categoria_id" alterada para permitir valores nulos.');
    } catch (e) {
        console.log('ℹ️ Coluna "categoria_id" já estava liberada ou erro ao alterar.');
    }

    console.log('✨ Todas as correções foram aplicadas com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao aplicar correções:', error.message);
    process.exit(1);
  }
}

fix();
