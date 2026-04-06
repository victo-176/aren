// Authentication Module
const auth = (() => {
    const API_URL = 'http://localhost:3000/api';
    let currentUser = null;
    let token = null;

    const init = () => {
        setupEventListeners();
        checkExistingToken();
    };

    const checkExistingToken = () => {
        const savedToken = localStorage.getItem('authToken');
        const savedUser = localStorage.getItem('currentUser');
        
        if (savedToken && savedUser) {
            token = savedToken;
            currentUser = JSON.parse(savedUser);
            switchScreen('chatScreen');
            chat.initialize();
        }
    };

    const setupEventListeners = () => {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', handleLogin);
        document.getElementById('signupToggle').addEventListener('click', toggleSignupMode);
        
        // Admin
        document.getElementById('adminToggle').addEventListener('click', showAdminModal);
        document.getElementById('closeAdminModal').addEventListener('click', closeAdminModal);
        document.getElementById('adminLoginBtn').addEventListener('click', handleAdminLogin);
        document.getElementById('adminPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleAdminLogin();
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');

        try {
            errorDiv.textContent = '';
            
            // Try login first
            let response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            // If login fails, try registration
            if (!response.ok) {
                response = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Authentication failed');
            }

            const data = await response.json();
            token = data.token;
            currentUser = data.user;

            localStorage.setItem('authToken', token);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            // Check if user is admin
            if (currentUser.isAdmin) {
                document.getElementById('adminPanelBtn').classList.remove('hidden');
            }

            switchScreen('chatScreen');
            chat.initialize();

        } catch (error) {
            errorDiv.textContent = error.message;
            console.error('Login error:', error);
        }
    };

    const toggleSignupMode = () => {
        const form = document.getElementById('loginForm');
        const btn = document.getElementById('signupToggle');
        const isSignupMode = form.classList.contains('signup-mode');
        
        form.classList.toggle('signup-mode');
        btn.textContent = isSignupMode ? 'CREATE ACCOUNT' : 'BACK TO LOGIN';
    };

    const showAdminModal = () => {
        document.getElementById('adminModal').classList.remove('hidden');
        document.getElementById('adminPassword').focus();
    };

    const closeAdminModal = () => {
        document.getElementById('adminModal').classList.add('hidden');
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminError').textContent = '';
    };

    const handleAdminLogin = async () => {
        const password = document.getElementById('adminPassword').value;
        const errorDiv = document.getElementById('adminError');

        try {
            errorDiv.textContent = '';

            const response = await fetch(`${API_URL}/auth/admin-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (!response.ok) {
                throw new Error('Invalid admin password');
            }

            const data = await response.json();
            token = data.token;
            currentUser = data.user;

            localStorage.setItem('authToken', token);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            closeAdminModal();
            switchScreen('adminPanel');
            admin.initialize();

        } catch (error) {
            errorDiv.textContent = error.message;
        }
    };

    const handleLogout = () => {
        token = null;
        currentUser = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        
        // Clear form
        document.getElementById('loginForm').reset();
        document.getElementById('adminPassword').value = '';
        
        switchScreen('loginScreen');
        chat.destroy();
    };

    const getToken = () => token;
    const getCurrentUser = () => currentUser;

    return {
        init,
        getToken,
        getCurrentUser,
        handleLogout
    };
})();

// Utility function to switch screens
function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    auth.init();
});
