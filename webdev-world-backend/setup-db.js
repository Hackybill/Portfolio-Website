const mysql = require('mysql2');
const fs = require('fs');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  multipleStatements: true
});

const sql = fs.readFileSync('./simple-db.sql', 'utf8');

db.query(sql, (err) => {
  if (err) {
    console.error('❌ Database setup failed:', err.message);
  } else {
    console.log('✅ Database and tables created successfully!');
  }
  db.end();
});