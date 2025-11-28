const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

console.log('🔐 Login Page Data:\n');

db.query('SELECT username, email, city, created_at FROM users ORDER BY id', (err, users) => {
  if (err) {
    console.error('❌ Error:', err.message);
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