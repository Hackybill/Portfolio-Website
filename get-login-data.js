const mysql = require('mysql2');
require('dotenv').config({ path: './webdev-world-backend/.env' });

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'webdev_world'
});

console.log('🔐 Login Page Data from Database:\n');

db.query('SELECT username, email, city, created_at, last_login FROM users ORDER BY id', (err, users) => {
  if (err) {
    console.error('❌ Database error:', err.message);
    return;
  }
  
  console.log('👥 Available Login Accounts:');
  console.table(users);
  
  console.log('\n🔑 Test Login Credentials:');
  users.forEach((user, index) => {
    console.log(`${index + 1}. Username: ${user.username} | Password: test123`);
  });
  
  db.end();
});