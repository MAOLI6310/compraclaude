// ============================================
// SISTEMA DE NOTIFICAÇÕES (toasts)
// ============================================

        function showNotification(title, message, type = 'info') {
            const notification = document.getElementById('notification');
            const icon = document.getElementById('notificationIcon');
            const titleEl = document.getElementById('notificationTitle');
            const messageEl = document.getElementById('notificationMessage');
            
            // Set content
            titleEl.textContent = title;
            messageEl.textContent = message;
            
            // Set icon and color based on type
            const colors = {
                success: 'bg-green-100 text-green-600',
                error: 'bg-red-100 text-red-600',
                warning: 'bg-yellow-100 text-yellow-600',
                info: 'bg-blue-100 text-blue-600'
            };
            
            const icons = {
                success: '✓',
                error: '✕',
                warning: '⚠',
                info: 'ℹ'
            };
            
            icon.className = `w-8 h-8 rounded-full flex items-center justify-center ${colors[type]}`;
            icon.textContent = icons[type];
            
            // Show notification
            notification.classList.add('show');
            
            // Hide after 3 seconds
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }

        // Plan selection and payment simulation
