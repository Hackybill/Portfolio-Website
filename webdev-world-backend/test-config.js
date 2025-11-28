// Configuration Test Script
const mysql = require('mysql2');
const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('🔍 Testing Backend Configuration...\n');

// Test 1: Environment Variables
console.log('1. Environment Variables Check:');
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'PORT', 'JWT_SECRET'];
const missingVars = [];

requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`   ✅ ${varName}: ${varName.includes('PASSWORD') || varName.includes('SECRET') ? '***' : process.env[varName]}`);
  } else {
    console.log(`   ❌ ${varName}: Missing`);
    missingVars.push(varName);
  }
});

if (missingVars.length > 0) {
  console.log(`\n⚠️  Missing environment variables: ${missingVars.join(', ')}`);
}

// Test 2: Database Connection
console.log('\n2. Database Connection Test:');
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'webdev_world'
});

db.connect((err) => {
  if (err) {
    console.log('   ❌ Database connection failed:', err.message);
    console.log('   💡 Solutions:');
    console.log('      - Make sure MySQL is running');
    console.log('      - Check DB credentials in .env file');
    console.log('      - Create database: CREATE DATABASE webdev_world;');
  } else {
    console.log('   ✅ Database connected successfully');
    
    // Test database tables
    db.query('SHOW TABLES', (err, results) => {
      if (err) {
        console.log('   ❌ Error checking tables:', err.message);
      } else {
        console.log(`   ✅ Found ${results.length} tables in database`);
        if (results.length === 0) {
          console.log('   💡 Run database.sql to create tables');
        }
      }
      db.end();
    });
  }
});

// Test 3: Email Configuration
console.log('\n3. Email Configuration Test:');
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  transporter.verify((error, success) => {
    if (error) {
      console.log('   ❌ Email configuration failed:', error.message);
      console.log('   💡 Solutions:');
      console.log('      - Use Gmail App Password, not regular password');
      console.log('      - Enable 2-factor authentication on Gmail');
      console.log('      - Generate App Password in Google Account settings');
    } else {
      console.log('   ✅ Email configuration is valid');
    }
  });
} else {
  console.log('   ⚠️  Email credentials not configured');
  console.log('   💡 Add EMAIL_USER and EMAIL_PASS to .env file');
}

// Test 4: JWT Secret
console.log('\n4. JWT Secret Test:');
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32) {
  console.log('   ✅ JWT Secret is properly configured');
} else {
  console.log('   ⚠️  JWT Secret should be at least 32 characters long');
  console.log('   💡 Use a strong, random secret key');
}

console.log('\n🔧 Configuration test completed!');