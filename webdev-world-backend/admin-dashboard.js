const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

function showLiveData() {
  console.clear();
  console.log('🖥️  ADMIN DASHBOARD - Live Data\n');
  
  // Show recent users
  db.query('SELECT username, email, city, created_at FROM users ORDER BY created_at DESC LIMIT 5', (err, users) => {
    if (!err) {
      console.log('👥 RECENT USERS:');
      console.table(users);
    }
  });
  
  // Show recent messages
  db.query('SELECT name, email, topic, message, created_at FROM contact_messages ORDER BY created_at DESC LIMIT 5', (err, messages) => {
    if (!err) {
      console.log('\n📧 RECENT MESSAGES:');
      console.table(messages);
    }
  });
  
  console.log('\n🔄 Refreshing every 10 seconds... Press Ctrl+C to exit\n');
}

// Show data every 10 seconds
showLiveData();
setInterval(showLiveData, 10000);