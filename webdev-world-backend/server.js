// server.js - Main Backend Server
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Security headers
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});

// Database Connection with connection pooling
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'webdev_world',
  port: process.env.DB_PORT || 3306,
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
});

// Test database connection
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    console.log('💡 Make sure MySQL is running and credentials are correct');
    return;
  }
  console.log('✅ Connected to MySQL Database');
  connection.release();
});

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_here';

// Email Configuration (for contact form)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ============================================================
// AUTHENTICATION ROUTES
// ============================================================

// User Registration
app.post('/api/register', async (req, res) => {
  try {
    const { fullName, email, username, password } = req.body;

    // Validation
    if (!fullName || !email || !username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Console log for admin to see
    console.log('\n👤 NEW USER REGISTRATION:');
    console.log('Name:', fullName);
    console.log('Email:', email);
    console.log('Username:', username);
    console.log('Time:', new Date().toLocaleString());
    console.log('----------------------------\n');

    // Check if user already exists
    db.query(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [email, username],
      async (err, results) => {
        if (err) {
          return res.status(500).json({ 
            success: false, 
            message: 'Database error' 
          });
        }

        if (results.length > 0) {
          return res.status(400).json({ 
            success: false, 
            message: 'User already exists' 
          });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        db.query(
          'INSERT INTO users (full_name, email, username, password, created_at) VALUES (?, ?, ?, ?, NOW())',
          [fullName, email, username, hashedPassword],
          (err, result) => {
            if (err) {
              return res.status(500).json({ 
                success: false, 
                message: 'Registration failed' 
              });
            }

            console.log('✅ User registered successfully with ID:', result.insertId);
            
            res.status(201).json({ 
              success: true, 
              message: 'Registration successful!',
              userId: result.insertId
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// User Login
app.post('/api/login', (req, res) => {
  try {
    const { username, password, city } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }

    // Find user
    db.query(
      'SELECT * FROM users WHERE username = ?',
      [username],
      async (err, results) => {
        if (err) {
          return res.status(500).json({ 
            success: false, 
            message: 'Database error' 
          });
        }

        if (results.length === 0) {
          return res.status(401).json({ 
            success: false, 
            message: 'Invalid credentials' 
          });
        }

        const user = results[0];

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          return res.status(401).json({ 
            success: false, 
            message: 'Invalid credentials' 
          });
        }

        // Update last login and city
        db.query(
          'UPDATE users SET last_login = NOW(), city = ? WHERE id = ?',
          [city, user.id]
        );

        // Console log for admin to see
        console.log('\n🔐 USER LOGIN:');
        console.log('Username:', user.username);
        console.log('Email:', user.email);
        console.log('City:', city);
        console.log('Time:', new Date().toLocaleString());
        console.log('----------------------------\n');

        // Generate JWT token
        const token = jwt.sign(
          { id: user.id, username: user.username },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        res.json({ 
          success: true, 
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.full_name
          }
        });
      }
    );
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// ============================================================
// CONTACT FORM ROUTES
// ============================================================

// Submit Contact Form
app.post('/api/contact', (req, res) => {
  try {
    const { name, email, topic, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and message are required' 
      });
    }

    // Save to database
    db.query(
      'INSERT INTO contact_messages (name, email, topic, message, created_at) VALUES (?, ?, ?, ?, NOW())',
      [name, email, topic || 'General', message],
      (err, result) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to save message' 
          });
        }

        // Console log for admin to see
        console.log('\n📧 NEW CONTACT MESSAGE:');
        console.log('Name:', name);
        console.log('Email:', email);
        console.log('Topic:', topic || 'General');
        console.log('Message:', message);
        console.log('Time:', new Date().toLocaleString());
        console.log('----------------------------\n');

        // Send email notification (optional)
        const mailOptions = {
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: process.env.EMAIL_USER, // Send to your email
          subject: `New Contact Form: ${topic || 'General'}`,
          html: `
            <h3>New Contact Message</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Topic:</strong> ${topic || 'General'}</p>
            <p><strong>Message:</strong></p>
            <p>${message.replace(/\n/g, '<br>')}</p>
            <hr>
            <p><small>Sent from WebDev World Contact Form</small></p>
          `
        };

        transporter.sendMail(mailOptions, (err, info) => {
          if (err) console.error('Email error:', err);
        });

        res.json({ 
          success: true, 
          message: 'Message sent successfully!',
          messageId: result.insertId
        });
      }
    );
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// Get all contact messages (admin only)
app.get('/api/contact/messages', verifyToken, (req, res) => {
  db.query(
    'SELECT * FROM contact_messages ORDER BY created_at DESC',
    (err, results) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Database error' 
        });
      }
      res.json({ success: true, messages: results });
    }
  );
});

// ============================================================
// USER PROFILE ROUTES
// ============================================================

// Get user profile (protected route)
app.get('/api/user/profile', verifyToken, (req, res) => {
  db.query(
    'SELECT id, full_name, email, username, city, created_at, last_login FROM users WHERE id = ?',
    [req.user.id],
    (err, results) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Database error' 
        });
      }

      if (results.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      res.json({ success: true, user: results[0] });
    }
  );
});

// Update user profile
app.put('/api/user/profile', verifyToken, (req, res) => {
  const { fullName, email, city } = req.body;

  db.query(
    'UPDATE users SET full_name = ?, email = ?, city = ? WHERE id = ?',
    [fullName, email, city, req.user.id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: 'Update failed' 
        });
      }

      res.json({ 
        success: true, 
        message: 'Profile updated successfully' 
      });
    }
  );
});

// ============================================================
// MIDDLEWARE - JWT Verification
// ============================================================

function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(403).json({ 
      success: false, 
      message: 'No token provided' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    req.user = decoded;
    next();
  });
}

// ============================================================
// SERVER START
// ============================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  db.end(() => {
    console.log('✅ Database connections closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  db.end(() => {
    console.log('✅ Database connections closed');
    process.exit(0);
  });
});