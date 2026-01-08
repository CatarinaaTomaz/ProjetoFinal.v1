const API_URL = 'http://localhost:3000/api/auth';

// 1. LÓGICA DE LOGIN
const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const msgErro = document.getElementById('mensagemErro');
        
        msgErro.classList.add('d-none');
        msgErro.textContent = '';

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            console.log("DADOS DO LOGIN:", data);

            if (response.ok) {
                // CASO 1: PRECISA DE 2FA
                if (data.require2fa) {
                    console.log("A guardar ID:", data.userId);
                    localStorage.setItem('tempUserId', data.userId);
                    
                    // Trocar interfaces
                    document.getElementById('loginForm').style.display = 'none';
                    const form2FA = document.getElementById('form2FA');
                    form2FA.classList.remove('d-none');
                    form2FA.style.display = 'block';
                    
                    // Aviso visual
                    const aviso = document.createElement('div');
                    aviso.className = 'alert alert-success mt-3 text-center';
                    aviso.textContent = `Código enviado para ${email}`;
                    document.querySelector('.card-body').appendChild(aviso);

                } else {
                    // CASO 2: LOGIN DIRETO
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    window.location.href = 'dashboard.html';
                }
            } else {
                throw new Error(data.msg || 'Erro ao fazer login');
            }
        } catch (error) {
            msgErro.textContent = error.message;
            msgErro.classList.remove('d-none');
            document.getElementById('loginForm').style.display = 'block';
        }
    });
}

// 2. LÓGICA DE VERIFICAÇÃO DO CÓDIGO
const otpForm = document.getElementById('otpForm');

if (otpForm) {
    otpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const codigo = document.getElementById('otpCode').value;
        
        // --- CORREÇÃO: Ler do LocalStorage ---
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
                body: JSON.stringify({ userId: userId, codigo }) // Enviar o ID correto
            });

            const data = await response.json();

            if (response.ok) {
                // Limpar ID temporário
                localStorage.removeItem('tempUserId');
                
                // Guardar sessão real
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                if (data.user.role === 'Admin') {
                    window.location.href = 'dashboard.html';
                } else {
                    alert("Login com sucesso!");
                    // window.location.href = 'portal.html';
                }
            } else {
                alert(data.msg || "Código inválido");
            }
        } catch (error) {
            console.error("Erro no 2FA:", error);
            alert("Erro de conexão.");
        }
    });
}