const API_URL = 'http://localhost:3000/api';
const BASE_URL = 'http://localhost:3000'; // URL base para imagens

document.addEventListener("DOMContentLoaded", () => {
    // 1. Verificar Token
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    carregarCursosDisponiveis();

    if (!token || !userStr) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Preencher Dados
    try {
        const user = JSON.parse(userStr);

        // Preencher textos
        if(document.getElementById('nomeAluno')) document.getElementById('nomeAluno').textContent = user.nome || user.nome_completo || 'Utilizador';
        if(document.getElementById('userEmail')) document.getElementById('userEmail').textContent = user.email;
        if(document.getElementById('userRole')) document.getElementById('userRole').textContent = user.role || 'Formando';
        if(document.getElementById('userId')) document.getElementById('userId').textContent = user.id || user.id_user;
        if(document.getElementById('cursoAluno')) document.getElementById('cursoAluno').textContent = user.role || 'Formando';

        // 3. Carregar Foto
        // Se a foto não começar por "http" (login social), adicionamos o prefixo da pasta uploads
        if (user.foto) {
            const fotoSrc = user.foto.startsWith('http') 
                ? user.foto 
                : `${BASE_URL}/uploads/${user.foto}`;
            document.getElementById('imgPerfil').src = fotoSrc;
        }

    } catch (e) {
        console.error("Erro ao ler utilizador:", e);
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

    // Dados Atuais
    const userStr = localStorage.getItem('user');
    const user = JSON.parse(userStr);
    const token = localStorage.getItem('token');
    const userId = user.id || user.id_user;

    // PREPARAR FORMDATA (Correção: precisamos enviar os outros campos também ou o backend pode reclamar)
    // No entanto, o nosso controlador atualiza apenas o que enviamos se estiver bem feito.
    // Como segurança, enviamos o nome e email atuais para não os perder.
    const formData = new FormData();
    formData.append('foto', file);
    formData.append('nome', user.nome || user.nome_completo);
    formData.append('email', user.email);

    try {
        const imgElement = document.getElementById('imgPerfil');
        imgElement.style.opacity = '0.5';

        // CORREÇÃO: Usar a rota PUT /users/:id (a mesma do Dashboard)
        const res = await fetch(`${API_URL}/users/${userId}`, {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + token },
            body: formData
        });

        const data = await res.json();

        if (res.ok) {
            // Atualizar imagem no ecrã
            // A resposta do backend traz { msg: "...", foto: "nome-da-foto.jpg" }
            const novaFotoUrl = `${BASE_URL}/uploads/${data.foto}`;
            imgElement.src = novaFotoUrl + '?t=' + new Date().getTime(); // Cache busting
            
            // Atualizar LocalStorage
            user.foto = data.foto; // Guarda apenas o nome do ficheiro
            localStorage.setItem('user', JSON.stringify(user));

            alert('Foto atualizada com sucesso!');
        } else {
            alert('Erro: ' + (data.msg || 'Erro desconhecido'));
        }

    } catch (error) {
        console.error(error);
        alert('Erro ao ligar ao servidor.');
    } finally {
        document.getElementById('imgPerfil').style.opacity = '1';
    }
}

async function carregarCursosDisponiveis() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    const tbody = document.getElementById('listaCursosCandidatura');
    const userId = user.id || user.id_user;

    // Se API_URL não estiver definida, usa a padrão (segurança)
    const url = (typeof API_URL !== 'undefined' ? API_URL : 'http://localhost:3000/api');

    const res = await fetch(`${url}/cursos/disponiveis/${userId}`, { headers: { 'Authorization': 'Bearer ' + token } });
    const cursos = await res.json();

    tbody.innerHTML = '';
    if (cursos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Sem cursos disponíveis.</td></tr>';
        return;
    }

    cursos.forEach(c => {
        let estadoHtml = '<span class="badge bg-light text-dark border">Não Inscrito</span>';
        let btnHtml = `<button class="btn btn-sm btn-primary" onclick="candidatar(${c.id_curso})">Candidatar</button>`;

        if (c.estado_inscricao === 'Aceite') {
            estadoHtml = '<span class="badge bg-success">Inscrito</span>';
            btnHtml = '<button class="btn btn-sm btn-outline-success" disabled><i class="fas fa-check"></i></button>';
        } else if (c.estado_inscricao === 'Pendente') {
            estadoHtml = '<span class="badge bg-warning text-dark">Pendente</span>';
            btnHtml = '<button class="btn btn-sm btn-outline-secondary" disabled><i class="fas fa-clock"></i></button>';
        } else if (c.estado_inscricao === 'Rejeitado') {
             estadoHtml = '<span class="badge bg-danger">Rejeitado</span>';
             btnHtml = `<button class="btn btn-sm btn-outline-danger" onclick="candidatar(${c.id_curso})">Reenviar</button>`;
        }

        tbody.innerHTML += `
            <tr>
                <td class="fw-bold">${c.nome}</td>
                <td>${c.area}</td>
                <td>${new Date(c.inicio).toLocaleDateString()}</td>
                <td>${estadoHtml}</td>
                <td>${btnHtml}</td>
            </tr>`;
    });
}

async function candidatar(cursoId) {
    if(!confirm("Enviar candidatura?")) return;
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    const userId = user.id || user.id_user;
    const url = (typeof API_URL !== 'undefined' ? API_URL : 'http://localhost:3000/api');

    const res = await fetch(`${url}/cursos/candidatar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify({ cursoId, userId })
    });
    
    if(res.ok) { alert("Candidatura enviada!"); carregarCursosDisponiveis(); }
    else { alert("Erro ao candidatar."); }
}


function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}