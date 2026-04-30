const pool = require('../src/config/database');
require('dotenv').config();

async function checkUsers() {
  try {
    const [users] = await pool.query('SELECT id, email, nome FROM usuarios');
    console.log('Users in database:', users);
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    process.exit();
  }
}

checkUsers();
