document.addEventListener("DOMContentLoaded", () => {
    // 1. Verificar se existe Token
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Preencher os dados na página
    try {
        const user = JSON.parse(userStr);

        // Preencher Nome
        document.getElementById('userName').textContent = user.nome || user.nome_completo;
        
        // Preencher Email
        document.getElementById('userEmail').textContent = user.email;

        // Preencher Role
        document.getElementById('userRole').textContent = user.role || 'Formando';

        // Preencher ID
        document.getElementById('userId').textContent = user.id || user.id_user;

        // Se quiseres mostrar se o 2FA está ativo (lógica futura)
        // document.getElementById('toggle2FA').checked = true; 

    } catch (e) {
        console.error("Erro ao ler dados do utilizador", e);
        logout(); // Se os dados estiverem corrompidos, força logout
    }
});

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}