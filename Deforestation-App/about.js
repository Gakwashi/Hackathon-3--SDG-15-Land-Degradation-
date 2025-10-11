document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
    
    const loginBtn = document.getElementById('login-btn');
    const authModal = document.getElementById('auth-modal');
    const closeModal = document.querySelector('.close-modal');
    
    // Modal functionality
    loginBtn.addEventListener('click', () => authModal.classList.remove('hidden'));
    closeModal.addEventListener('click', () => authModal.classList.add('hidden'));
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) authModal.classList.add('hidden');
    });
});