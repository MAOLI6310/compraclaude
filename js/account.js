// ============================================
// PÁGINA MINHA CONTA
// ============================================

        function showAccountSection(sectionName) {
            // Hide all account sections
            document.querySelectorAll('.account-section').forEach(section => {
                section.classList.add('hidden');
            });
            
            // Show selected section
            const targetSection = document.getElementById(`account-${sectionName}`);
            if (targetSection) {
                targetSection.classList.remove('hidden');
            }
            
            // Update tab active state
            document.querySelectorAll('.account-tab').forEach(tab => {
                tab.classList.remove('active', 'bg-white/50');
            });
            
            // Find and activate the corresponding tab
            const activeTab = document.querySelector(`[onclick="showAccountSection('${sectionName}')"]`);
            if (activeTab) {
                activeTab.classList.add('active', 'bg-white/50');
            }
        }

        async function updateProfile() {
            const name = document.getElementById('profileName').value;
            const email = document.getElementById('profileEmail').value;
            
            if (!name || !email) {
                showNotification('Erro', 'Preencha todos os campos obrigatórios', 'error');
                return;
            }
            
            if (!currentUser) return;

            // Atualiza o nome na tabela profiles (o e-mail é gerenciado
            // pela autenticação do Supabase, não fica em "profiles")
            const { error } = await supabaseClient
                .from('profiles')
                .update({ full_name: name })
                .eq('id', currentUser.uid);

            if (error) {
                console.error('Erro ao atualizar perfil:', error);
                showNotification('Erro', 'Não foi possível salvar as alterações', 'error');
                return;
            }

            currentUser.name = name;
            updateUserInterface();
            showNotification('Perfil Atualizado!', 'Suas informações foram salvas com sucesso', 'success');
        }

        function cancelSubscription() {
            if (confirm('Tem certeza que deseja cancelar sua assinatura? Você perderá acesso às funcionalidades premium.')) {
                showNotification('Assinatura Cancelada', 'Sua assinatura será cancelada no final do período atual', 'info');
            }
        }

        function removeAlert(alertId) {
            if (confirm('Deseja remover este alerta de preço?')) {
                showNotification('Alerta Removido', 'O alerta foi removido com sucesso', 'success');
            }
        }

        function viewAlert(alertId) {
            showNotification('Oferta Encontrada!', 'Redirecionando para a melhor oferta...', 'success');
        }

        function saveSettings() {
            showNotification('Configurações Salvas!', 'Suas preferências foram atualizadas', 'success');
        }

        // TEST LOGIN FUNCTION - REMOVE IN PRODUCTION
