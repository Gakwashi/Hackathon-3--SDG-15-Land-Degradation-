document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
    
    const loginBtn = document.getElementById('login-btn');
    const getStartedBtn = document.getElementById('get-started-btn');
    const authModal = document.getElementById('auth-modal');
    const closeModal = document.querySelector('.close-modal');
    
    // Open modal
    loginBtn.addEventListener('click', () => authModal.classList.remove('hidden'));
    getStartedBtn.addEventListener('click', () => authModal.classList.remove('hidden'));
    
    // Close modal
    closeModal.addEventListener('click', () => authModal.classList.add('hidden'));
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) authModal.classList.add('hidden');
    });
});