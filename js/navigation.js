// ============================================
// NAVEGAÇÃO
// Troca de páginas (SPA), menu mobile, modais
// ============================================

        function showPage(pageId) {
            // Hide all pages
            document.querySelectorAll('.page-section').forEach(page => {
                page.classList.remove('active');
            });
            
            // Show selected page
            const targetPage = document.getElementById(pageId);
            if (targetPage) {
                targetPage.classList.add('active');
            }
            
            // Update navigation
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            
            // Find and activate the corresponding nav link
            const navLink = document.querySelector(`[onclick="showPage('${pageId}')"]`);
            if (navLink) {
                navLink.classList.add('active');
            }
            
            // Close mobile menu if open
            document.getElementById('mobileMenu').classList.add('hidden');
            
            // Close any open modals
            closeAllModals();
            
            // Scroll to top
            window.scrollTo(0, 0);
        }

        // Mobile menu toggle
        function toggleMobileMenu() {
            const mobileMenu = document.getElementById('mobileMenu');
            mobileMenu.classList.toggle('hidden');
        }

        // Modal functions
        function showLoginModal() {
            closeAllModals();
            document.getElementById('loginModal').classList.add('active');
        }

        function showSignupModal() {
            closeAllModals();
            document.getElementById('signupModal').classList.add('active');
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
        }

        function closeAllModals() {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.remove('active');
            });
        }

        // Authentication Functions
