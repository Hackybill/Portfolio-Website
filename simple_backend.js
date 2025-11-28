const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Simple file-based storage
const USERS_FILE = 'users.json';
const CONTACTS_FILE = 'contacts.json';

// Initialize files if they don't exist
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, '[]');
}
if (!fs.existsSync(CONTACTS_FILE)) {
    fs.writeFileSync(CONTACTS_FILE, '[]');
}

// Helper functions
const readUsers = () => JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
const writeUsers = (users) => fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
const readContacts = () => JSON.parse(fs.readFileSync(CONTACTS_FILE, 'utf8'));
const writeContacts = (contacts) => fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2));

// User Registration
app.post('/api/register', async (req, res) => {
    try {
        const { fullName, email, username, password } = req.body;

        if (!fullName || !email || !username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }

        const users = readUsers();
        
        // Check if user exists
        if (users.find(u => u.email === email || u.username === username)) {
            return res.status(400).json({ 
                success: false, 
                message: 'User already exists' 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = {
            id: users.length + 1,
            fullName,
            email,
            username,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        writeUsers(users);

        res.status(201).json({ 
            success: true, 
            message: 'Registration successful!',
            userId: newUser.id
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// User Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password, city } = req.body;

        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username and password are required' 
            });
        }

        const users = readUsers();
        const user = users.find(u => u.username === username);

        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Update user with city and last login
        user.city = city;
        user.lastLogin = new Date().toISOString();
        writeUsers(users);

        const token = jwt.sign(
            { id: user.id, username: user.username },
            'simple_secret_key',
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
                fullName: user.fullName
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Contact Form
app.post('/api/contact', (req, res) => {
    try {
        const { name, email, topic, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ 
                success: false, 
                message: 'Name, email, and message are required' 
            });
        }

        const contacts = readContacts();
        
        const newContact = {
            id: contacts.length + 1,
            name,
            email,
            topic: topic || 'General',
            message,
            createdAt: new Date().toISOString()
        };

        contacts.push(newContact);
        writeContacts(contacts);

        res.json({ 
            success: true, 
            message: 'Message sent successfully!',
            messageId: newContact.id
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

const PORT = 5001;

app.listen(PORT, () => {
    console.log(`🚀 Simple Backend Server running on port ${PORT}`);
    console.log(`✅ Data will be stored in users.json and contacts.json`);
});