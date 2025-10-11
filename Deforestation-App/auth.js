class AuthManager {
    constructor() {
        this.isLogin = true;
        
        // Only initialize if we're in app.html
        if (this.isAppPage()) {
            this.init();
        }
    }

    isAppPage() {
        return window.location.pathname.includes('app.html') || 
               window.location.pathname === '/app.html' ||
               !document.getElementById('auth-form'); // If no auth form, assume not app page
    }

    init() {
        this.checkAuthState();
        this.setupEventListeners();
    }

    async checkAuthState() {
        try {
            const user = await window.forestService.getCurrentUser();
            if (user) {
                this.showApp(user);
            } else {
                this.showAuth();
            }
        } catch (error) {
            console.error('Auth check error:', error);
            this.showAuth();
        }
    }

    setupEventListeners() {
        const authForm = document.getElementById('auth-form');
        const toggleAuth = document.getElementById('toggle-auth');
        const logoutBtn = document.getElementById('dashboard-logout-btn');

        if (authForm) authForm.addEventListener('submit', (e) => this.handleAuth(e));
        if (toggleAuth) toggleAuth.addEventListener('click', () => this.toggleAuthMode());
        if (logoutBtn) logoutBtn.addEventListener('click', () => this.handleLogout());
    }

    async handleAuth(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const authButton = document.getElementById('auth-button');

        if (!authButton) return;

        authButton.disabled = true;
        authButton.textContent = this.isLogin ? 'Signing In...' : 'Creating Account...';

        try {
            let user;
            if (this.isLogin) {
                user = await window.forestService.signIn(email, password);
            } else {
                user = await window.forestService.signUp(email, password);
            }
            
            this.showApp(user.user);
        } catch (error) {
            alert(`Authentication failed: ${error.message}`);
        } finally {
            authButton.disabled = false;
            authButton.textContent = this.isLogin ? 'Sign In' : 'Sign Up';
        }
    }

    toggleAuthMode() {
        this.isLogin = !this.isLogin;
        
        const authTitle = document.getElementById('auth-title');
        const authButton = document.getElementById('auth-button');
        const toggleAuth = document.getElementById('toggle-auth');

        if (authTitle && authButton && toggleAuth) {
            if (this.isLogin) {
                authTitle.textContent = 'Sign In to Restore Forests';
                authButton.textContent = 'Sign In';
                toggleAuth.textContent = 'Need an account? Join ForestRestore';
            } else {
                authTitle.textContent = 'Join ForestRestore';
                authButton.textContent = 'Sign Up';
                toggleAuth.textContent = 'Have an account? Sign in';
            }
        }
    }

    async handleLogout() {
        try {
            await window.forestService.signOut();
            this.showAuth();
        } catch (error) {
            alert(`Logout failed: ${error.message}`);
        }
    }

    showApp(user) {
        const authScreen = document.getElementById('auth-screen');
        const dashboardScreen = document.getElementById('dashboard-screen');
        const userEmail = document.getElementById('dashboard-user-email');
        
        if (authScreen && dashboardScreen && userEmail) {
            authScreen.classList.remove('active');
            dashboardScreen.classList.add('active');
            userEmail.textContent = user.email;
            
            console.log("✅ Successfully switched to dashboard");
        } else {
            console.error("❌ Could not find required screen elements");
        }
    }

    showAuth() {
        const authScreen = document.getElementById('auth-screen');
        const dashboardScreen = document.getElementById('dashboard-screen');
        
        if (authScreen && dashboardScreen) {
            authScreen.classList.add('active');
            dashboardScreen.classList.remove('active');
            
            if (document.getElementById('auth-form')) {
                document.getElementById('auth-form').reset();
            }
        }
    }
}

// Only initialize if we're on a page that has auth elements
document.addEventListener('DOMContentLoaded', () => {
    // Check if auth form exists before initializing
    if (document.getElementById('auth-form')) {
        window.authManager = new AuthManager();
    }
});