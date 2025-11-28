// Authentication Guard System
class AuthGuard {
    constructor() {
        this.sessionDuration = 2 * 60 * 1000; // 2 minutes
        this.init();
    }

    init() {
        this.checkAuth();
        this.updateNavigation();
    }

    checkAuth() {
        const session = this.getSession();
        const currentPage = window.location.pathname.split('/').pop();
        
        // Skip auth check for login/register pages
        if (currentPage === 'login.html' || currentPage === 'register.html') {
            return;
        }

        // Temporarily disable auth check for testing
        // if (!session || this.isSessionExpired(session)) {
        //     this.clearSession();
        //     window.location.href = 'login.html';
        //     return;
        // }

        // Extend session if user is active
        if (session) {
            this.extendSession();
        }
    }

    getSession() {
        const session = localStorage.getItem('auth_session');
        return session ? JSON.parse(session) : null;
    }

    isSessionExpired(session) {
        return Date.now() - session.loginTime > this.sessionDuration;
    }

    extendSession() {
        const session = this.getSession();
        if (session) {
            session.loginTime = Date.now();
            localStorage.setItem('auth_session', JSON.stringify(session));
        }
    }

    clearSession() {
        localStorage.removeItem('auth_session');
    }

    updateNavigation() {
        const session = this.getSession();
        const authButtons = document.querySelector('.auth-buttons');
        
        if (session && !this.isSessionExpired(session)) {
            // User is logged in - hide login buttons
            if (authButtons) {
                authButtons.style.display = 'none';
            }
            
            // Add logout button if not exists
            this.addLogoutButton();
        } else {
            // User not logged in - show login buttons
            if (authButtons) {
                authButtons.style.display = 'flex';
            }
        }
    }

    addLogoutButton() {
        if (!document.querySelector('.logout-btn')) {
            const nav = document.querySelector('.navbar ul');
            const logoutBtn = document.createElement('li');
            logoutBtn.innerHTML = '<button class="logout-btn" onclick="authGuard.logout()">Logout</button>';
            nav.appendChild(logoutBtn);
        }
    }

    logout() {
        this.clearSession();
        window.location.href = 'login.html';
    }
}

// Initialize auth guard
const authGuard = new AuthGuard();