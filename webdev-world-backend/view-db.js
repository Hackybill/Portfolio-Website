const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

console.log('📊 Database Contents:\n');

db.query('SHOW TABLES', (err, tables) => {
  if (err) return console.error(err);
  
  tables.forEach(table => {
    const tableName = Object.values(table)[0];
    db.query(`SELECT COUNT(*) as count FROM ${tableName}`, (err, result) => {
      if (!err) {
        console.log(`${tableName}: ${result[0].count} records`);
      }
    });
  });
  
  setTimeout(() => db.end(), 1000);
});