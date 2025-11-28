// Enhanced Security Authentication System
class SecureAuth {
    constructor() {
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        this.maxLoginAttempts = 5;
        this.lockoutTime = 15 * 60 * 1000; // 15 minutes
        this.init();
    }

    init() {
        this.checkSession();
        this.setupCSRFProtection();
        this.setupRateLimiting();
        this.setupSecurityHeaders();
    }

    // JWT Token Management
    generateToken(user) {
        const header = btoa(JSON.stringify({alg: 'HS256', typ: 'JWT'}));
        const payload = btoa(JSON.stringify({
            id: user.id,
            username: user.username,
            role: user.role,
            exp: Date.now() + this.sessionTimeout,
            iat: Date.now(),
            jti: this.generateUUID()
        }));
        const signature = this.generateSignature(header + '.' + payload);
        return `${header}.${payload}.${signature}`;
    }

    validateToken(token) {
        try {
            const [header, payload, signature] = token.split('.');
            const expectedSignature = this.generateSignature(header + '.' + payload);
            
            if (signature !== expectedSignature) return false;
            
            const decodedPayload = JSON.parse(atob(payload));
            if (decodedPayload.exp < Date.now()) return false;
            
            return decodedPayload;
        } catch {
            return false;
        }
    }

    generateSignature(data) {
        return btoa(data + 'SECRET_KEY_2024').replace(/[^a-zA-Z0-9]/g, '');
    }

    // Password Security
    async hashPassword(password) {
        const salt = this.generateSalt();
        const hash = await this.pbkdf2(password, salt, 100000);
        return `${salt}:${hash}`;
    }

    async verifyPassword(password, hashedPassword) {
        const [salt, hash] = hashedPassword.split(':');
        const computedHash = await this.pbkdf2(password, salt, 100000);
        return hash === computedHash;
    }

    async pbkdf2(password, salt, iterations) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + salt);
        let hash = data;
        
        for (let i = 0; i < iterations; i++) {
            const hashBuffer = await crypto.subtle.digest('SHA-256', hash);
            hash = new Uint8Array(hashBuffer);
        }
        
        return btoa(String.fromCharCode(...hash));
    }

    generateSalt() {
        return btoa(Math.random().toString(36) + Date.now().toString(36));
    }

    // Session Management
    createSession(user) {
        const token = this.generateToken(user);
        const sessionData = {
            token,
            user: {id: user.id, username: user.username, role: user.role},
            loginTime: Date.now(),
            lastActivity: Date.now(),
            fingerprint: this.generateFingerprint()
        };
        
        localStorage.setItem('auth_session', JSON.stringify(sessionData));
        this.startSessionTimer();
        return token;
    }

    checkSession() {
        const session = this.getSession();
        if (!session) return false;
        
        const tokenData = this.validateToken(session.token);
        if (!tokenData) {
            this.logout();
            return false;
        }
        
        // Check fingerprint
        if (session.fingerprint !== this.generateFingerprint()) {
            this.logout();
            return false;
        }
        
        // Update last activity
        session.lastActivity = Date.now();
        localStorage.setItem('auth_session', JSON.stringify(session));
        return true;
    }

    getSession() {
        try {
            return JSON.parse(localStorage.getItem('auth_session'));
        } catch {
            return null;
        }
    }

    logout() {
        localStorage.removeItem('auth_session');
        sessionStorage.clear();
        window.location.href = 'login.html';
    }

    startSessionTimer() {
        setInterval(() => {
            const session = this.getSession();
            if (session && Date.now() - session.lastActivity > this.sessionTimeout) {
                this.logout();
            }
        }, 60000); // Check every minute
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

    // Rate Limiting
    setupRateLimiting() {
        this.attempts = JSON.parse(localStorage.getItem('login_attempts') || '{}');
    }

    checkRateLimit(identifier) {
        const now = Date.now();
        const attempts = this.attempts[identifier] || {count: 0, lastAttempt: 0, lockedUntil: 0};
        
        if (attempts.lockedUntil > now) {
            return {allowed: false, timeLeft: Math.ceil((attempts.lockedUntil - now) / 1000)};
        }
        
        if (now - attempts.lastAttempt > 60000) {
            attempts.count = 0;
        }
        
        return {allowed: attempts.count < this.maxLoginAttempts, attempts: attempts.count};
    }

    recordAttempt(identifier, success) {
        const now = Date.now();
        if (!this.attempts[identifier]) {
            this.attempts[identifier] = {count: 0, lastAttempt: 0, lockedUntil: 0};
        }
        
        if (success) {
            delete this.attempts[identifier];
        } else {
            this.attempts[identifier].count++;
            this.attempts[identifier].lastAttempt = now;
            
            if (this.attempts[identifier].count >= this.maxLoginAttempts) {
                this.attempts[identifier].lockedUntil = now + this.lockoutTime;
            }
        }
        
        localStorage.setItem('login_attempts', JSON.stringify(this.attempts));
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

    validateCSRF(token) {
        return token === this.csrfToken;
    }

    // Security Headers
    setupSecurityHeaders() {
        // Content Security Policy
        const meta = document.createElement('meta');
        meta.httpEquiv = 'Content-Security-Policy';
        meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;";
        document.head.appendChild(meta);
        
        // Prevent clickjacking
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

    // Input Sanitization
    sanitizeInput(input) {
        return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                   .replace(/[<>]/g, '')
                   .trim();
    }

    // XSS Protection
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// User Database (In production, this would be server-side)
class UserDatabase {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users_db') || '[]');
        this.initDefaultUsers();
    }

    async initDefaultUsers() {
        if (this.users.length === 0) {
            const auth = new SecureAuth();
            this.users = [
                {
                    id: 1,
                    username: 'admin',
                    password: await auth.hashPassword('admin123'),
                    role: 'admin',
                    email: 'admin@futuristic.com',
                    created: Date.now(),
                    lastLogin: null,
                    twoFactorEnabled: true
                },
                {
                    id: 2,
                    username: 'user',
                    password: await auth.hashPassword('user123'),
                    role: 'user',
                    email: 'user@futuristic.com',
                    created: Date.now(),
                    lastLogin: null,
                    twoFactorEnabled: false
                }
            ];
            this.saveUsers();
        }
    }

    async findUser(username) {
        return this.users.find(user => user.username === username);
    }

    async createUser(userData) {
        const auth = new SecureAuth();
        const user = {
            id: Date.now(),
            username: auth.sanitizeInput(userData.username),
            password: await auth.hashPassword(userData.password),
            role: 'user',
            email: auth.sanitizeInput(userData.email),
            created: Date.now(),
            lastLogin: null,
            twoFactorEnabled: false
        };
        
        this.users.push(user);
        this.saveUsers();
        return user;
    }

    updateLastLogin(userId) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            user.lastLogin = Date.now();
            this.saveUsers();
        }
    }

    saveUsers() {
        localStorage.setItem('users_db', JSON.stringify(this.users));
    }
}

// Page Protection
class PageProtection {
    constructor() {
        this.auth = new SecureAuth();
        this.protectedPages = ['admin.html', 'dashboard.html'];
        this.init();
    }

    init() {
        this.checkPageAccess();
        this.setupLogoutTimer();
        this.preventDevTools();
    }

    checkPageAccess() {
        const currentPage = window.location.pathname.split('/').pop();
        
        if (this.protectedPages.includes(currentPage)) {
            const session = this.auth.getSession();
            if (!session || !this.auth.validateToken(session.token)) {
                window.location.href = 'login.html';
                return;
            }
            
            if (currentPage === 'admin.html' && session.user.role !== 'admin') {
                window.location.href = 'index.html';
                return;
            }
        }
    }

    setupLogoutTimer() {
        let warningShown = false;
        setInterval(() => {
            const session = this.auth.getSession();
            if (session) {
                const timeLeft = this.auth.sessionTimeout - (Date.now() - session.lastActivity);
                
                if (timeLeft < 300000 && !warningShown) { // 5 minutes warning
                    warningShown = true;
                    if (confirm('Your session will expire in 5 minutes. Continue?')) {
                        session.lastActivity = Date.now();
                        localStorage.setItem('auth_session', JSON.stringify(session));
                        warningShown = false;
                    }
                }
            }
        }, 60000);
    }

    preventDevTools() {
        // Disable right-click
        document.addEventListener('contextmenu', e => e.preventDefault());
        
        // Disable F12, Ctrl+Shift+I, etc.
        document.addEventListener('keydown', e => {
            if (e.key === 'F12' || 
                (e.ctrlKey && e.shiftKey && e.key === 'I') ||
                (e.ctrlKey && e.shiftKey && e.key === 'C') ||
                (e.ctrlKey && e.key === 'U')) {
                e.preventDefault();
            }
        });
        
        // Detect dev tools
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > 200 || 
                window.outerWidth - window.innerWidth > 200) {
                document.body.innerHTML = '<h1>Access Denied</h1>';
            }
        }, 1000);
    }
}

// Initialize security system
document.addEventListener('DOMContentLoaded', () => {
    new PageProtection();
});

// Export for use in other files
window.SecureAuth = SecureAuth;
window.UserDatabase = UserDatabase;
window.PageProtection = PageProtection;