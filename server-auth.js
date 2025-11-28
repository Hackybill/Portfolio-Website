// Server-Integrated Authentication System
class ServerAuth {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api';
        this.init();
    }

    init() {
        this.checkSession();
        this.setupCSRFProtection();
        this.setupSecurityHeaders();
    }

    // Server Login with Fallback
    async login(username, password) {
        try {
            const response = await fetch(`${this.apiUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.storeSession(data.token, data.user);
                this.logActivity('login', `User ${username} logged in successfully`);
                return { success: true, user: data.user };
            } else {
                this.logActivity('login_failed', `Failed login attempt for ${username}`);
                return { success: false, error: data.error };
            }
        } catch (error) {
            // Server offline - use client-side fallback
            return this.fallbackLogin(username, password);
        }
    }

    // Client-side fallback authentication
    fallbackLogin(username, password) {
        // Check default users first
        const defaultUsers = {
            'admin': { password: 'admin123', role: 'admin', email: 'admin@futuristic.com' },
            'user': { password: 'user123', role: 'user', email: 'user@futuristic.com' }
        };
        
        // Check registered users from localStorage
        const registeredUsers = JSON.parse(localStorage.getItem('client_users') || '[]');
        const registeredUser = registeredUsers.find(u => u.username === username);
        
        let user = null;
        
        // Check default users
        if (defaultUsers[username] && defaultUsers[username].password === password) {
            user = {
                id: username === 'admin' ? 1 : 2,
                username,
                role: defaultUsers[username].role,
                email: defaultUsers[username].email
            };
        }
        // Check registered users
        else if (registeredUser && registeredUser.password === password) {
            user = {
                id: registeredUser.id,
                username: registeredUser.username,
                role: registeredUser.role || 'user',
                email: registeredUser.email
            };
            
            // Update last login
            registeredUser.lastLogin = new Date().toISOString();
            localStorage.setItem('client_users', JSON.stringify(registeredUsers));
        }
        
        if (user) {
            // Store simple session for auth-guard compatibility
            localStorage.setItem('auth_session', JSON.stringify({
                user,
                loginTime: Date.now()
            }));
            
            this.logActivity('login_fallback', `Offline login: ${username}`);
            
            return { success: true, user };
        } else {
            this.logActivity('login_failed', `Invalid credentials: ${username}`);
            return { success: false, error: 'Invalid credentials' };
        }
    }

    // Server Registration with Fallback
    async register(userData) {
        try {
            const response = await fetch(`${this.apiUrl}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.logActivity('register', `New user registered: ${userData.username}`);
            }
            
            return data;
        } catch (error) {
            // Server offline - use client-side registration
            return this.fallbackRegister(userData);
        }
    }

    // Client-side fallback registration
    fallbackRegister(userData) {
        const users = JSON.parse(localStorage.getItem('client_users') || '[]');
        
        // Check if user already exists
        if (users.find(u => u.username === userData.username || u.email === userData.email)) {
            return { success: false, error: 'User already exists' };
        }
        
        // Create new user
        const newUser = {
            id: Date.now(),
            username: this.sanitizeInput(userData.username),
            password: userData.password, // In real app, this would be hashed
            email: this.sanitizeInput(userData.email),
            fullname: this.sanitizeInput(userData.fullname || ''),
            role: 'user',
            created: new Date().toISOString(),
            lastLogin: null
        };
        
        users.push(newUser);
        localStorage.setItem('client_users', JSON.stringify(users));
        
        this.logActivity('register_fallback', `Offline registration: ${userData.username}`);
        
        return {
            success: true,
            message: 'User registered successfully',
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email
            }
        };
    }

    // Session Management
    storeSession(token, user) {
        const sessionData = {
            token,
            user,
            loginTime: Date.now(),
            fingerprint: this.generateFingerprint()
        };
        localStorage.setItem('auth_session', JSON.stringify(sessionData));
        this.startSessionTimer();
    }

    async verifySession() {
        const token = this.getToken();
        if (!token) return false;
        
        try {
            const response = await fetch(`${this.apiUrl}/verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.success;
            }
            return false;
        } catch (error) {
            // Server offline - verify client-side session
            return this.verifyClientSession();
        }
    }

    verifyClientSession() {
        const session = this.getSession();
        if (!session || !session.token) return false;
        
        try {
            const tokenData = JSON.parse(atob(session.token));
            return tokenData.exp > Date.now();
        } catch {
            return false;
        }
    }

    getToken() {
        const session = this.getSession();
        return session ? session.token : null;
    }

    getSession() {
        try {
            return JSON.parse(localStorage.getItem('auth_session'));
        } catch {
            return null;
        }
    }

    checkSession() {
        const session = this.getSession();
        if (!session) return false;
        
        // Check fingerprint
        if (session.fingerprint !== this.generateFingerprint()) {
            this.logout();
            return false;
        }
        
        return true;
    }

    async logout() {
        const token = this.getToken();
        if (token) {
            try {
                await fetch(`${this.apiUrl}/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                this.logActivity('logout', 'User logged out');
            } catch (error) {
                console.log('Logout request failed');
            }
        }
        
        localStorage.removeItem('auth_session');
        sessionStorage.clear();
        window.location.href = 'login.html';
    }

    startSessionTimer() {
        setInterval(async () => {
            const isValid = await this.verifySession();
            if (!isValid) {
                this.logout();
            }
        }, 60000); // Check every minute
    }

    // Activity Logging
    logActivity(type, message) {
        const logs = JSON.parse(localStorage.getItem('activity_logs') || '[]');
        logs.push({
            id: Date.now(),
            type,
            message,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            ip: 'client-side'
        });
        
        // Keep only last 100 logs
        if (logs.length > 100) {
            logs.splice(0, logs.length - 100);
        }
        
        localStorage.setItem('activity_logs', JSON.stringify(logs));
        console.log(`📝 ${type}: ${message}`);
    }

    getActivityLogs() {
        return JSON.parse(localStorage.getItem('activity_logs') || '[]');
    }

    // Device Fingerprinting
    generateFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint', 2, 2);
        
        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            canvas.toDataURL()
        ].join('|');
        
        return btoa(fingerprint).slice(0, 32);
    }

    // CSRF Protection
    setupCSRFProtection() {
        this.csrfToken = this.generateUUID();
        document.querySelectorAll('form').forEach(form => {
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = 'csrf_token';
            csrfInput.value = this.csrfToken;
            form.appendChild(csrfInput);
        });
    }

    // Security Headers
    setupSecurityHeaders() {
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;";
        document.head.appendChild(meta);
        
        if (window.top !== window.self) {
            window.top.location = window.self.location;
        }
    }

    // Utility Functions
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    sanitizeInput(input) {
        return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                   .replace(/[<>]/g, '')
                   .trim();
    }
}

// Server Database Integration
class ServerDatabase {
    constructor() {
        this.apiUrl = 'http://localhost:3000/api';
        this.auth = new ServerAuth();
    }

    async getUsers() {
        const token = this.auth.getToken();
        try {
            const response = await fetch(`${this.apiUrl}/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            return data.success ? data.users : [];
        } catch (error) {
            // Server offline - return client-side users
            return this.getClientUsers();
        }
    }

    getClientUsers() {
        const registeredUsers = JSON.parse(localStorage.getItem('client_users') || '[]');
        const defaultUsers = [
            {
                id: 1,
                username: 'admin',
                email: 'admin@futuristic.com',
                role: 'admin',
                created: '2024-01-01T00:00:00.000Z',
                lastLogin: null
            },
            {
                id: 2,
                username: 'user',
                email: 'user@futuristic.com',
                role: 'user',
                created: '2024-01-01T00:00:00.000Z',
                lastLogin: null
            }
        ];
        
        return [...defaultUsers, ...registeredUsers.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            created: user.created,
            lastLogin: user.lastLogin
        }))];
    }

    async getServerLogs() {
        const token = this.auth.getToken();
        try {
            const response = await fetch(`${this.apiUrl}/logs`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            return data.success ? data.logs : [];
        } catch (error) {
            return [];
        }
    }

    async sendContactMessage(messageData) {
        try {
            const response = await fetch(`${this.apiUrl}/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageData)
            });
            const result = await response.json();
            
            if (result.success) {
                this.auth.logActivity('contact', `Contact message sent: ${messageData.subject}`);
            }
            
            return result;
        } catch (error) {
            return { success: false, error: 'Connection failed' };
        }
    }
}

// Enhanced Page Protection with Server Integration
class ServerPageProtection {
    constructor() {
        this.auth = new ServerAuth();
        this.protectedPages = ['admin.html'];
        this.init();
    }

    async init() {
        await this.checkPageAccess();
        this.setupLogoutTimer();
        this.preventDevTools();
        this.monitorUserActivity();
    }

    async checkPageAccess() {
        const currentPage = window.location.pathname.split('/').pop();
        
        if (this.protectedPages.includes(currentPage)) {
            const isValid = await this.auth.verifySession();
            if (!isValid) {
                window.location.href = 'login.html';
                return;
            }
            
            const session = this.auth.getSession();
            if (currentPage === 'admin.html' && session.user.role !== 'admin') {
                this.auth.logActivity('unauthorized_access', `Unauthorized admin access attempt`);
                window.location.href = 'index.html';
                return;
            }
        }
    }

    setupLogoutTimer() {
        let warningShown = false;
        setInterval(async () => {
            const isValid = await this.auth.verifySession();
            if (!isValid && !warningShown) {
                warningShown = true;
                if (confirm('Your session has expired. Please login again.')) {
                    window.location.href = 'login.html';
                }
            }
        }, 60000);
    }

    monitorUserActivity() {
        let activityTimer;
        const resetTimer = () => {
            clearTimeout(activityTimer);
            activityTimer = setTimeout(() => {
                this.auth.logActivity('idle', 'User idle for 10 minutes');
            }, 10 * 60 * 1000);
        };

        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetTimer, true);
        });
        
        resetTimer();
    }

    preventDevTools() {
        document.addEventListener('contextmenu', e => e.preventDefault());
        
        document.addEventListener('keydown', e => {
            if (e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.shiftKey && e.key === 'C') ||
                (e.ctrlKey && e.key === 'U')) {
                e.preventDefault();
                this.auth.logActivity('security', 'Dev tools access attempt blocked');
            }
        });
        
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > 200 || 
                window.outerWidth - window.innerWidth > 200) {
                this.auth.logActivity('security', 'Dev tools detected');
                document.body.innerHTML = '<h1 style="color: #00fff0; text-align: center; margin-top: 50vh;">🔒 Access Denied - Security Violation Detected</h1>';
            }
        }, 1000);
    }
}

// Initialize server-integrated security system
document.addEventListener('DOMContentLoaded', () => {
    new ServerPageProtection();
});

// Export for use in other files
window.ServerAuth = ServerAuth;
window.ServerDatabase = ServerDatabase;
window.ServerPageProtection = ServerPageProtection;