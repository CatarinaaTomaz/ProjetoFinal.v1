const API_URL = 'http://localhost:3000/api';
const BASE_URL = 'http://localhost:3000';

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const user = JSON.parse(userStr);

        // SEGURANÇA: Se não for Formador, manda para o sítio certo
        if (user.role === 'Admin') window.location.href = 'dashboard.html';
        if (user.role === 'Formando') window.location.href = 'portal-aluno.html';

        // Preencher dados
        document.getElementById('nomeUser').textContent = user.nome || user.nome_completo;
        document.getElementById('userEmail').textContent = user.email;
        document.getElementById('userId').textContent = user.id || user.id_user;
        document.getElementById('roleUser').textContent = user.role;

        // Foto
        if (user.foto) {
            document.getElementById('imgPerfil').src = `${BASE_URL}/${user.foto}`;
        }

    } catch (e) {
        console.error(e);
        logout();
    }
});

// A mesma função de upload (podes copiar do portal.js ou deixar num ficheiro utils.js partilhado)
async function uploadFoto() {
    const input = document.getElementById('inputFoto');
    const file = input.files[0];
    if (!file) return;

    const userStr = localStorage.getItem('user');
    const user = JSON.parse(userStr);
    const token = localStorage.getItem('token');
    const userId = user.id || user.id_user;

    const formData = new FormData();
    formData.append('foto', file);

    try {
        document.getElementById('imgPerfil').style.opacity = '0.5';
        const res = await fetch(`${API_URL}/users/${userId}/foto`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + token },
            body: formData
        });

        const data = await res.json();
        if (res.ok) {
            const novaFotoUrl = `${BASE_URL}/${data.foto}`;
            document.getElementById('imgPerfil').src = novaFotoUrl + '?t=' + new Date().getTime();
            
            user.foto = data.foto;
            localStorage.setItem('user', JSON.stringify(user));
            alert('Foto atualizada!');
        } else {
            alert('Erro: ' + data.msg);
        }
    } catch (error) {
        console.error(error);
    } finally {
        document.getElementById('imgPerfil').style.opacity = '1';
    }
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}