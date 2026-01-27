const API_URL = 'http://localhost:3000/api';
const BASE_URL = 'http://localhost:3000'; // URL base para imagens

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    carregarMeusModulos();

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

async function carregarMeusModulos() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    const tbody = document.getElementById('listaMeusModulos');
    const userId = user.id || user.id_user;
    const url = (typeof API_URL !== 'undefined' ? API_URL : 'http://localhost:3000/api');

    // Chama a rota nova que criámos no Passo 1
    const res = await fetch(`${url}/modulos/formador/${userId}`, { 
        headers: { 'Authorization': 'Bearer ' + token } 
    });
    const modulos = await res.json();

    tbody.innerHTML = '';
    if (modulos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center p-4 text-muted">Ainda não tens módulos atribuídos.</td></tr>';
        return;
    }

    modulos.forEach(m => {
        const nomeCurso = m.Curso ? m.Curso.nome : '<span class="text-danger">Sem Curso</span>';
        const nomeSala = m.Sala ? `<span class="badge bg-info text-dark">${m.Sala.nome}</span>` : '<span class="badge bg-secondary">Sem Sala</span>';
        
        tbody.innerHTML += `
            <tr>
                <td class="fw-bold text-primary">${m.nome}</td>
                <td>${nomeCurso}</td>
                <td>${nomeSala}</td>
                <td>${m.descricao || '-'}</td>
            </tr>`;
    });
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}