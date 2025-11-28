const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

console.log('📊 Backend Data:\n');

// View users
db.query('SELECT id, full_name, email, username, city, created_at FROM users', (err, users) => {
  if (!err) {
    console.log('👥 USERS:');
    console.table(users);
  }
});

// View contact messages
db.query('SELECT id, name, email, topic, message, created_at FROM contact_messages', (err, messages) => {
  if (!err) {
    console.log('\n📧 CONTACT MESSAGES:');
    console.table(messages);
  }
  db.end();
});