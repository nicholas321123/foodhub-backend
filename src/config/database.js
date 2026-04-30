const mysql = require('mysql2');
require('dotenv').config();

// Configuração do pool de conexões com o Easypanel (Melhorada para evitar ECONNRESET)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// Testar a conexão imediatamente
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ ERRO DE CONEXÃO COM O EASYPANEL:', err.message);
  } else {
    console.log('🚀 LIGAÇÃO ESTABELECIDA COM SUCESSO AO EASYPANEL!');
    connection.release();
  }
});

module.exports = pool.promise();
