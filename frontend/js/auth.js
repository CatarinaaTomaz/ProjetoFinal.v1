const API_URL = 'http://localhost:3000/api/auth';

document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // 1. LÓGICA DE LOGIN (SUBMETER FORMULÁRIO)
    // ==========================================
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const msgErro = document.getElementById('mensagemErro');
            
            if(msgErro) {
                msgErro.classList.add('d-none');
                msgErro.textContent = '';
            }

            try {
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();
                console.log("RESPOSTA LOGIN:", data);

                if (response.ok) {
                    
                    // CASO 1: PRECISA DE 2FA
                    if (data.require2fa) {
                        localStorage.setItem('tempUserId', data.userId);
                        
                        document.getElementById('loginForm').style.display = 'none';
                        const form2FA = document.getElementById('form2FA'); 
                        
                        if(form2FA) {
                            form2FA.classList.remove('d-none');
                            form2FA.style.display = 'block';
                            
                            const aviso = document.createElement('div');
                            aviso.className = 'alert alert-success mt-3 text-center';
                            aviso.textContent = `Código enviado para ${email}`;
                            document.querySelector('.card-body').insertBefore(aviso, form2FA);
                        } else {
                            window.location.href = '2fa.html';
                        }

                    } else {
                        // CASO 2: LOGIN DIRETO
                        processarLoginSucesso(data);
                    }

                } else {
                    throw new Error(data.msg || 'Email ou password incorretos.');
                }
            } catch (error) {
                console.error("Erro Login:", error);
                if(msgErro) {
                    msgErro.textContent = error.message;
                    msgErro.classList.remove('d-none');
                } else {
                    alert(error.message);
                }
                document.getElementById('loginForm').style.display = 'block';
            }
        });
    }

    // ==========================================
    // 2. LÓGICA DE VERIFICAÇÃO DO CÓDIGO (OTP)
    // ==========================================
    const otpForm = document.getElementById('otpForm') || document.getElementById('form2FA');

    if (otpForm) {
        otpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const codigoInput = document.getElementById('otpCode') || document.getElementById('codigoInput');
            const codigo = codigoInput.value;
            const userId = localStorage.getItem('tempUserId');

            if (!userId) {
                alert("Sessão expirada. Faz login novamente.");
                window.location.reload(); 
                return;
            }

            try {
                const response = await fetch(`${API_URL}/verify-2fa`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: userId, codigo })
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.removeItem('tempUserId');
                    processarLoginSucesso(data);
                } else {
                    alert(data.msg || "Código inválido");
                }
            } catch (error) {
                console.error("Erro no 2FA:", error);
                alert("Erro de conexão.");
            }
        });
    }

    // ==========================================
    // 3. LÓGICA DE REGISTO
    // ==========================================
    const registerForm = document.getElementById('registerForm');
    if(registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nome = document.getElementById('nome').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const msgSucesso = document.getElementById('mensagemSucesso');
            const msgErro = document.getElementById('mensagemErro');

            if(msgSucesso) msgSucesso.classList.add('d-none');
            if(msgErro) msgErro.classList.add('d-none');

            try {
                const res = await fetch(`http://localhost:3000/api/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, email, password })
                });

                const data = await res.json();

                if (res.ok) {
                    if(msgSucesso) {
                        msgSucesso.innerText = data.msg;
                        msgSucesso.classList.remove('d-none');
                    } else alert(data.msg);
                    registerForm.reset();
                } else {
                    if(msgErro) {
                        msgErro.innerText = data.msg || 'Erro ao registar.';
                        msgErro.classList.remove('d-none');
                    } else alert(data.msg);
                }
            } catch (error) {
                console.error(error);
                if(msgErro) {
                    msgErro.innerText = "Erro de ligação ao servidor.";
                    msgErro.classList.remove('d-none');
                }
            }
        });
    }

});

// ==========================================
// FUNÇÃO AUXILIAR: REDIRECIONAMENTO CORRIGIDO 🚦
// ==========================================
function processarLoginSucesso(data) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    console.log("Login OK! Role:", data.user.role);

    // AQUI ESTÁ A CORREÇÃO:
    // Se for Admin OU Secretaria -> Vai para o Dashboard
    if (data.user.role === 'Admin' || data.user.role === 'Secretaria') {
        window.location.href = 'dashboard.html';
    } 
    else if (data.user.role === 'Formador') {
        window.location.href = 'portal-formador.html';
    } 
    else {
        // Todos os outros (Formando, etc) vão para o Portal do Aluno
        window.location.href = 'portal-aluno.html';
    }
}