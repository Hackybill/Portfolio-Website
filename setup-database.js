const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || ''
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
    return;
  }
  console.log('✅ Connected to MySQL');
  
  // Create database
  connection.query('CREATE DATABASE IF NOT EXISTS webdev_world', (err) => {
    if (err) {
      console.error('❌ Database creation failed:', err);
      return;
    }
    console.log('✅ Database created/exists');
    
    // Use the database
    connection.query('USE webdev_world', (err) => {
      if (err) {
        console.error('❌ Failed to use database:', err);
        return;
      }
      
      // Create users table
      const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          full_name VARCHAR(100) NOT NULL,
          email VARCHAR(100) NOT NULL UNIQUE,
          username VARCHAR(50) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          city VARCHAR(50) DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP NULL DEFAULT NULL
        )
      `;
      
      connection.query(createUsersTable, (err) => {
        if (err) {
          console.error('❌ Users table creation failed:', err);
          return;
        }
        console.log('✅ Users table created/exists');
        
        // Create contact_messages table
        const createContactTable = `
          CREATE TABLE IF NOT EXISTS contact_messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL,
            topic VARCHAR(100) DEFAULT 'General',
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;
        
        connection.query(createContactTable, (err) => {
          if (err) {
            console.error('❌ Contact table creation failed:', err);
            return;
          }
          console.log('✅ Contact messages table created/exists');
          console.log('🎉 Database setup complete!');
          connection.end();
        });
      });
    });
  });
});