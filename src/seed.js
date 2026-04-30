const pool = require('./config/database');

async function seed() {
  console.log('🌱 Iniciando sincronização de dados com o Easypanel...');
  
  const restaurantes = [
    {
      nome: 'Burger King',
      endereco: 'Rua das Flores, 123',
      logo_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Burger_King_2020.svg/1200px-Burger_King_2020.svg.png',
      status: 'aberto',
      tempo_estimado_entrega: 30
    },
    {
      nome: 'Pizza Hut',
      endereco: 'Av. Paulista, 1000',
      logo_url: 'https://upload.wikimedia.org/wikipedia/sco/thumb/d/d2/Pizza_Hut_logo.svg/1088px-Pizza_Hut_logo.svg.png',
      status: 'aberto',
      tempo_estimado_entrega: 45
    },
    {
      nome: 'BoaBoca',
      endereco: 'Rua das Delícias, 50',
      logo_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100',
      status: 'aberto',
      tempo_estimado_entrega: 25
    }
  ];

  try {
    for (const res of restaurantes) {
      // Verificar se já existe para não duplicar
      const [existing] = await pool.query('SELECT id FROM restaurantes WHERE nome = ?', [res.nome]);
      
      if (existing.length === 0) {
        await pool.query(
          'INSERT INTO restaurantes (nome, endereco, logo_url, status, tempo_estimado_entrega) VALUES (?, ?, ?, ?, ?)',
          [res.nome, res.endereco, res.logo_url, res.status, res.tempo_estimado_entrega]
        );
        console.log(`✅ Restaurante "${res.nome}" inserido no Easypanel.`);
      } else {
        console.log(`ℹ️ Restaurante "${res.nome}" já existe, pulando...`);
      }
    }
    console.log('✨ Sincronização concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao sincronizar dados:', error.message);
    process.exit(1);
  }
}

seed();
