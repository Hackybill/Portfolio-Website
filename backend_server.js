const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('.'));

// Simple file-based storage
const USERS_FILE = path.join(__dirname, 'users.json');
const CONTACTS_FILE = path.join(__dirname, 'contacts.json');

// Initialize files if they don't exist
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}
if (!fs.existsSync(CONTACTS_FILE)) {
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify([]));
}

// Helper functions
const readUsers = () => {
    try {
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    } catch {
        return [];
    }
};

const writeUsers = (users) => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

const readContacts = () => {
    try {
        return JSON.parse(fs.readFileSync(CONTACTS_FILE, 'utf8'));
    } catch {
        return [];
    }
};

const writeContacts = (contacts) => {
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2));
};

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// User Registration - Optimized for speed
app.post('/api/register', (req, res) => {
    const { fullName, email, username, password } = req.body;

    // Quick validation
    if (!fullName || !email || !username || !password) {
        return res.status(400).json({
            success: false,
            message: 'All fields required'
        });
    }

    // Fast user creation
    const userId = Date.now();
    const newUser = {
        id: userId,
        fullName,
        email,
        username,
        password,
        createdAt: new Date().toISOString()
    };

    // Async file operations for speed
    setImmediate(() => {
        try {
            const users = readUsers();
            users.push(newUser);
            writeUsers(users);
        } catch (error) {
            console.log('Background save error:', error);
        }
    });

    // Immediate response
    res.status(201).json({
        success: true,
        message: 'Registration successful!',
        userId: userId
    });
});

// Admin Login - Enhanced Security
app.post('/api/admin-login', (req, res) => {
    const { username, password, secretKey } = req.body;

    // Admin credentials (in production, store securely)
    const ADMIN_USERNAME = 'cyberart_admin';
    const ADMIN_PASSWORD = 'CyberArt@2024!';
    const ADMIN_SECRET_KEY = 'CYBER_ADMIN_KEY_2024';

    if (!username || !password || !secretKey) {
        return res.status(400).json({
            success: false,
            message: 'All fields required'
        });
    }

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD || secretKey !== ADMIN_SECRET_KEY) {
        return res.status(401).json({
            success: false,
            message: 'Invalid admin credentials'
        });
    }

    res.json({
        success: true,
        message: 'Admin login successful',
        admin: {
            id: 'admin_001',
            username: ADMIN_USERNAME,
            role: 'admin',
            permissions: ['all']
        }
    });
});

// User Login - Optimized
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Username and password required'
        });
    }

    const users = readUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Invalid credentials'
        });
    }

    res.json({
        success: true,
        message: 'Login successful',
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.fullName
        }
    });
});

// Verify User for Password Reset
app.post('/api/verify-user', (req, res) => {
    const { username, email } = req.body;

    if (!username || !email) {
        return res.status(400).json({
            success: false,
            message: 'Username and email required'
        });
    }

    const users = readUsers();
    const user = users.find(u => u.username === username && u.email === email);

    if (!user) {
        return res.status(404).json({
            success: false,
            message: 'User not found or email does not match'
        });
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    res.json({
        success: true,
        message: 'User verified',
        code: verificationCode
    });
});

// Reset Password
app.post('/api/reset-password', (req, res) => {
    const { username, newPassword, verificationCode } = req.body;

    if (!username || !newPassword || !verificationCode) {
        return res.status(400).json({
            success: false,
            message: 'All fields required'
        });
    }

    const users = readUsers();
    const userIndex = users.findIndex(u => u.username === username);

    if (userIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    // Update password
    users[userIndex].password = newPassword;
    users[userIndex].updatedAt = new Date().toISOString();
    writeUsers(users);

    res.json({
        success: true,
        message: 'Password reset successful'
    });
});

// Contact Form - Fast response
app.post('/api/contact', (req, res) => {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({
            success: false,
            message: 'All fields required'
        });
    }

    const messageId = Date.now();
    const newContact = {
        id: messageId,
        name,
        email,
        message,
        createdAt: new Date().toISOString()
    };

    // Async save for speed
    setImmediate(() => {
        try {
            const contacts = readContacts();
            contacts.push(newContact);
            writeContacts(contacts);
        } catch (error) {
            console.log('Contact save error:', error);
        }
    });

    // Immediate response
    res.json({
        success: true,
        message: 'Message sent!',
        messageId: messageId
    });
});

// Admin API Endpoints
app.get('/api/admin/users', (req, res) => {
    const users = readUsers();
    res.json({ success: true, users });
});

// Add User (Admin)
app.post('/api/admin/add-user', (req, res) => {
    const { fullName, email, username, password } = req.body;

    if (!fullName || !email || !username || !password) {
        return res.status(400).json({
            success: false,
            message: 'All fields required'
        });
    }

    const users = readUsers();
    const existingUser = users.find(u => u.email === email || u.username === username);
    
    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: 'User already exists'
        });
    }

    const newUser = {
        id: Date.now(),
        fullName,
        email,
        username,
        password,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeUsers(users);

    res.json({
        success: true,
        message: 'User added successfully',
        user: newUser
    });
});

// Update User
app.put('/api/admin/update-user/:id', (req, res) => {
    const userId = req.params.id;
    const { fullName, email, username } = req.body;

    const users = readUsers();
    const userIndex = users.findIndex(u => u.id == userId);

    if (userIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    users[userIndex] = {
        ...users[userIndex],
        fullName: fullName || users[userIndex].fullName,
        email: email || users[userIndex].email,
        username: username || users[userIndex].username,
        updatedAt: new Date().toISOString()
    };

    writeUsers(users);

    res.json({
        success: true,
        message: 'User updated successfully',
        user: users[userIndex]
    });
});

// Delete User
app.delete('/api/admin/delete-user/:id', (req, res) => {
    const userId = req.params.id;
    const users = readUsers();
    const userIndex = users.findIndex(u => u.id == userId);

    if (userIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'User not found'
        });
    }

    const deletedUser = users.splice(userIndex, 1)[0];
    writeUsers(users);

    res.json({
        success: true,
        message: 'User deleted successfully',
        user: deletedUser
    });
});

app.get('/api/admin/messages', (req, res) => {
    const messages = readContacts();
    res.json({ success: true, messages });
});

// Delete Message
app.delete('/api/admin/delete-message/:id', (req, res) => {
    const messageId = req.params.id;
    const messages = readContacts();
    const messageIndex = messages.findIndex(m => m.id == messageId);

    if (messageIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'Message not found'
        });
    }

    const deletedMessage = messages.splice(messageIndex, 1)[0];
    writeContacts(messages);

    res.json({
        success: true,
        message: 'Message deleted successfully',
        deletedMessage
    });
});

app.post('/api/admin/clear-data', (req, res) => {
    writeUsers([]);
    writeContacts([]);
    res.json({ success: true, message: 'All data cleared' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`✅ Backend is ready!`);
    console.log(`🔐 Admin Login: cyberart_admin / CyberArt@2024! / CYBER_ADMIN_KEY_2024`);
});