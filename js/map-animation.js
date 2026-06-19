// ============================================
// ANIMAÇÃO DO MAPA (decorativo)
// ============================================

        function startMapAnimation() {
            const searchAnimation = document.getElementById('searchAnimation');
            if (searchAnimation) {
                searchAnimation.style.opacity = '1';
                
                // Create pulsing search effect
                mapAnimationInterval = setInterval(() => {
                    const stores = document.querySelectorAll('.store-marker');
                    stores.forEach((store, index) => {
                        setTimeout(() => {
                            store.style.transform = 'scale(1.5)';
                            store.style.opacity = '0.8';
                            setTimeout(() => {
                                store.style.transform = 'scale(1)';
                                store.style.opacity = '0.3';
                            }, 300);
                        }, index * 200);
                    });
                }, 2000);
            }
        }

        function stopMapAnimation() {
            const searchAnimation = document.getElementById('searchAnimation');
            if (searchAnimation) {
                searchAnimation.style.opacity = '0';
            }
            
            if (mapAnimationInterval) {
                clearInterval(mapAnimationInterval);
                mapAnimationInterval = null;
            }
            
            // Reset store markers
            const stores = document.querySelectorAll('.store-marker');
            stores.forEach(store => {
                store.style.transform = 'scale(1)';
                store.style.opacity = '0.3';
            });
        }

        // Account section functions
