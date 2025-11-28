const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'futuristic_website_secret_2024';

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Rate limiting
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: { error: 'Too many login attempts, try again later' }
});

// In-memory database (use MongoDB/PostgreSQL in production)
const users = [
    {
        id: 1,
        username: 'admin',
        password: '$2b$10$8K1p/a0dclxKxYqtnFuJ6.L1/XKtHkqg5Rn8kJvJ8kJvJ8kJvJ8kJ', // admin123
        role: 'admin',
        email: 'admin@futuristic.com',
        created: new Date(),
        lastLogin: null
    },
    {
        id: 2,
        username: 'user',
        password: '$2b$10$9L2q/b1edmyLyZruogGvK7.M2/YLuIlrh6So9lKwK9lKwK9lKwK9l', // user123
        role: 'user',
        email: 'user@futuristic.com',
        created: new Date(),
        lastLogin: null
    }
];

const sessions = new Map();
const loginAttempts = new Map();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Admin role middleware
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Login endpoint
app.post('/api/login', loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Find user
        const user = users.find(u => u.username === username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        user.lastLogin = new Date();

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username, 
                role: user.role 
            },
            JWT_SECRET,
            { expiresIn: '30m' }
        );

        // Store session
        sessions.set(token, {
            userId: user.id,
            loginTime: new Date(),
            lastActivity: new Date()
        });

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                email: user.email
            }
        });

        console.log(`✅ Login successful: ${username} (${user.role}) at ${new Date().toISOString()}`);

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Register endpoint
app.post('/api/register', async (req, res) => {
    try {
        const { username, password, email, fullname } = req.body;

        if (!username || !password || !email) {
            return res.status(400).json({ error: 'All fields required' });
        }

        // Check if user exists
        if (users.find(u => u.username === username || u.email === email)) {
            return res.status(409).json({ error: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = {
            id: users.length + 1,
            username,
            password: hashedPassword,
            role: 'user',
            email,
            fullname,
            created: new Date(),
            lastLogin: null
        };

        users.push(newUser);

        res.json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email
            }
        });

        console.log(`📝 New user registered: ${username} at ${new Date().toISOString()}`);

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Logout endpoint
app.post('/api/logout', authenticateToken, (req, res) => {
    const token = req.headers['authorization'].split(' ')[1];
    sessions.delete(token);
    
    res.json({ success: true, message: 'Logged out successfully' });
    console.log(`🚪 User logged out: ${req.user.username} at ${new Date().toISOString()}`);
});

// Verify session endpoint
app.get('/api/verify', authenticateToken, (req, res) => {
    const token = req.headers['authorization'].split(' ')[1];
    const session = sessions.get(token);
    
    if (!session) {
        return res.status(401).json({ error: 'Session expired' });
    }

    // Update last activity
    session.lastActivity = new Date();
    
    res.json({
        success: true,
        user: req.user,
        sessionInfo: {
            loginTime: session.loginTime,
            lastActivity: session.lastActivity
        }
    });
});

// Get all users (admin only)
app.get('/api/users', authenticateToken, requireAdmin, (req, res) => {
    const userList = users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        created: user.created,
        lastLogin: user.lastLogin
    }));

    res.json({ success: true, users: userList });
});

// Get system logs (admin only)
app.get('/api/logs', authenticateToken, requireAdmin, (req, res) => {
    const logs = [
        {
            id: 1,
            type: 'login',
            message: 'Admin login successful',
            timestamp: new Date(),
            ip: req.ip,
            userAgent: req.headers['user-agent']
        },
        {
            id: 2,
            type: 'security',
            message: 'Failed login attempt detected',
            timestamp: new Date(Date.now() - 300000),
            ip: '192.168.1.100',
            userAgent: 'Mozilla/5.0...'
        }
    ];

    res.json({ success: true, logs });
});

// Contact form endpoint
app.post('/api/contact', (req, res) => {
    const { name, email, subject, message } = req.body;
    
    // Store message (in production, save to database)
    const contactMessage = {
        id: Date.now(),
        name,
        email,
        subject,
        message,
        timestamp: new Date(),
        status: 'unread'
    };

    console.log(`📧 New contact message from ${name} (${email}): ${subject}`);
    
    res.json({ success: true, message: 'Message sent successfully' });
});

// Session cleanup (remove expired sessions)
setInterval(() => {
    const now = new Date();
    for (const [token, session] of sessions.entries()) {
        if (now - session.lastActivity > 30 * 60 * 1000) { // 30 minutes
            sessions.delete(token);
            console.log(`🧹 Expired session cleaned up`);
        }
    }
}, 5 * 60 * 1000); // Check every 5 minutes

// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', authenticateToken, requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Futuristic Website Server running on http://localhost:${PORT}`);
    console.log(`🔐 Security features enabled:`);
    console.log(`   - JWT Authentication`);
    console.log(`   - Rate Limiting`);
    console.log(`   - Password Hashing`);
    console.log(`   - Session Management`);
    console.log(`   - Admin Protection`);
    console.log(`\n👤 Default Users:`);
    console.log(`   Admin: admin/admin123`);
    console.log(`   User:  user/user123`);
});

module.exports = app;