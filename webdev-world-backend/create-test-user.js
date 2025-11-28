const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

async function createTestUser() {
  const hashedPassword = await bcrypt.hash('test123', 10);
  
  db.query(
    'INSERT INTO users (full_name, email, username, password, city) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE password = ?',
    ['Test User', 'test@test.com', 'testuser', hashedPassword, 'Test City', hashedPassword],
    (err, result) => {
      if (err) {
        console.log('❌ Error:', err.message);
      } else {
        console.log('✅ Test user created: testuser / test123');
      }
      db.end();
    }
  );
}

createTestUser();