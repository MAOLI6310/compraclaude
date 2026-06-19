// ============================================
// BACKEND SIMULADO (TEMPORÁRIO)
// Este arquivo simula Firebase Auth/Firestore usando localStorage.
// Será SUBSTITUÍDO por Supabase real na Etapa 2/3 do projeto.
// ============================================

        // Firebase Configuration (DEMO MODE - Simulação sem Firebase real)
        const firebaseConfig = {
            // Configuração será adicionada quando você configurar o Firebase
            demo: true
        };

        // Demo Firebase simulation
        const auth = {
            createUserWithEmailAndPassword: (email, password) => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve({
                            user: {
                                uid: 'demo_' + Date.now(),
                                email: email
                            }
                        });
                    }, 1000);
                });
            },
            signInWithEmailAndPassword: (email, password) => {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        // Simulate login check
                        const savedUsers = JSON.parse(localStorage.getItem('demoUsers') || '[]');
                        const user = savedUsers.find(u => u.email === email && u.password === password);
                        
                        if (user) {
                            resolve({
                                user: {
                                    uid: user.uid,
                                    email: user.email
                                }
                            });
                        } else {
                            reject({ code: 'auth/user-not-found' });
                        }
                    }, 1000);
                });
            },
            signOut: () => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        currentUser = null;
                        isLoggedIn = false;
                        resolve();
                    }, 500);
                });
            },
            onAuthStateChanged: (callback) => {
                // Simulate auth state
                setTimeout(() => {
                    const savedUser = JSON.parse(localStorage.getItem('currentDemoUser') || 'null');
                    callback(savedUser);
                }, 100);
            }
        };

        const db = {
            collection: (name) => ({
                doc: (id) => ({
                    set: (data) => {
                        return new Promise((resolve) => {
                            setTimeout(() => {
                                // Save to localStorage for demo
                                const key = `demo_${name}_${id}`;
                                localStorage.setItem(key, JSON.stringify(data));
                                resolve();
                            }, 500);
                        });
                    },
                    get: () => {
                        return new Promise((resolve) => {
                            setTimeout(() => {
                                const key = `demo_${name}_${id}`;
                                const data = localStorage.getItem(key);
                                resolve({
                                    exists: !!data,
                                    data: () => data ? JSON.parse(data) : null
                                });
                            }, 300);
                        });
                    },
                    update: (data) => {
                        return new Promise((resolve) => {
                            setTimeout(() => {
                                const key = `demo_${name}_${id}`;
                                const existing = localStorage.getItem(key);
                                if (existing) {
                                    const updated = { ...JSON.parse(existing), ...data };
                                    localStorage.setItem(key, JSON.stringify(updated));
                                }
                                resolve();
                            }, 300);
                        });
                    }
                }),
                add: (data) => {
                    return new Promise((resolve) => {
                        setTimeout(() => {
                            const id = 'demo_' + Date.now();
                            const key = `demo_${name}_${id}`;
                            localStorage.setItem(key, JSON.stringify(data));
                            resolve({ id });
                        }, 300);
                    });
                }
            })
        };

        // EmailJS Configuration (DEMO MODE)
        const emailjs = {
            init: () => {},
            send: (serviceId, templateId, params) => {
                return new Promise((resolve) => {
                    console.log('📧 Email simulado enviado:', params);
                    setTimeout(resolve, 1000);
                });
            }
        };

