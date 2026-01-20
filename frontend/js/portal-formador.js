const API_URL = 'http://localhost:3000/api';
const BASE_URL = 'http://localhost:3000'; // URL base para imagens

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const user = JSON.parse(userStr);

        // Segurança de Roles
        if (user.role === 'Admin') window.location.href = 'dashboard.html';
        if (user.role === 'Formando') window.location.href = 'portal-aluno.html';

        // Preencher dados
        document.getElementById('nomeUser').textContent = user.nome || user.nome_completo;
        if(document.getElementById('userEmail')) document.getElementById('userEmail').textContent = user.email;
        if(document.getElementById('userId')) document.getElementById('userId').textContent = user.id || user.id_user;
        if(document.getElementById('roleUser')) document.getElementById('roleUser').textContent = user.role;

        // Foto de Perfil
        if (user.foto) {
             const fotoSrc = user.foto.startsWith('http') 
                ? user.foto 
                : `${BASE_URL}/uploads/${user.foto}`;
            document.getElementById('imgPerfil').src = fotoSrc;
        }

    } catch (e) {
        console.error(e);
        logout();
    }
});

// ==========================================
// FUNÇÃO DE UPLOAD CORRIGIDA (PUT)
// ==========================================
async function uploadFoto() {
    const input = document.getElementById('inputFoto');
    const file = input.files[0];
    if (!file) return;

    const userStr = localStorage.getItem('user');
    const user = JSON.parse(userStr);
    const token = localStorage.getItem('token');
    const userId = user.id || user.id_user;

    // Criar FormData
    const formData = new FormData();
    formData.append('foto', file);
    // Enviar dados essenciais para garantir que o PUT não apaga nada
    formData.append('nome', user.nome || user.nome_completo);
    formData.append('email', user.email);

    try {
        document.getElementById('imgPerfil').style.opacity = '0.5';
        
        // CORREÇÃO: Usar PUT /users/:id
        const res = await fetch(`${API_URL}/users/${userId}`, {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + token },
            body: formData
        });

        const data = await res.json();
        
        if (res.ok) {
            const novaFotoUrl = `${BASE_URL}/uploads/${data.foto}`;
            document.getElementById('imgPerfil').src = novaFotoUrl + '?t=' + new Date().getTime();
            
            user.foto = data.foto;
            localStorage.setItem('user', JSON.stringify(user));
            
            alert('Foto atualizada!');
        } else {
            alert('Erro: ' + (data.msg || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error(error);
        alert('Erro de conexão.');
    } finally {
        document.getElementById('imgPerfil').style.opacity = '1';
    }
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}