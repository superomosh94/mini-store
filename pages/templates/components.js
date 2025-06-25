// Load components from templates
async function loadComponents() {
    try {
        // Load header
        const headerResponse = await fetch('/pages/templates/header.html');
        const header = await headerResponse.text();
        
        // Load footer
        const footerResponse = await fetch('/pages/templates/footer.html');
        let footer = await footerResponse.text();
        
        // Update year in footer
        footer = footer.replace('${new Date().getFullYear()}', new Date().getFullYear());
        
        // Insert components
        document.body.insertAdjacentHTML('afterbegin', header);
        document.body.insertAdjacentHTML('beforeend', footer);
        
        // Initialize functionality
        setupMobileMenu();
        updateCartCount();
        
        // Add active class to current page link
        highlightCurrentPage();
        
    } catch (error) {
        console.error('Error loading components:', error);
    }
}

// Mobile menu functionality
function setupMobileMenu() {
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const mainNav = document.getElementById('mainNav');
    
    if (mobileToggle && mainNav) {
        mobileToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            mainNav.classList.toggle('active');
        });
        
        document.addEventListener('click', function() {
            mainNav.classList.remove('active');
        });
    }
}

// Update cart count from localStorage
function updateCartCount() {
    const cartCount = document.getElementById('cart-count');
    if (cartCount) {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
}

// Highlight current page in navigation
function highlightCurrentPage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href').split('/').pop();
        if (linkPage === currentPage) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
    });
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadComponents);
} else {
    loadComponents();
}

// Make functions available globally
window.components = {
    updateCartCount,
    setupMobileMenu
};