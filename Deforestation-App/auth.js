class AuthManager {
    constructor() {
        this.isLogin = true;
        this.init();
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
        const logoutBtn = document.getElementById('logout-btn');

        authForm.addEventListener('submit', (e) => this.handleAuth(e));
        toggleAuth.addEventListener('click', () => this.toggleAuthMode());
        logoutBtn.addEventListener('click', () => this.handleLogout());
    }

    async handleAuth(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const authButton = document.getElementById('auth-button');

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

    async handleLogout() {
        try {
            await window.forestService.signOut();
            this.showAuth();
        } catch (error) {
            alert(`Logout failed: ${error.message}`);
        }
    }

    showApp(user) {
        document.getElementById('auth-screen').classList.remove('active');
        document.getElementById('app-screen').classList.add('active');
        document.getElementById('user-email').textContent = user.email;
        
        // Initialize app
        if (window.app) {
            window.app.init();
        }
    }

    showAuth() {
        document.getElementById('auth-screen').classList.add('active');
        document.getElementById('app-screen').classList.remove('active');
        
        // Clear form
        document.getElementById('auth-form').reset();
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});