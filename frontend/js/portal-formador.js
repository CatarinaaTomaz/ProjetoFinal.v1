// ==========================================
// CONFIGURAÇÃO INICIAL
// ==========================================
// Tenta usar a API_URL global (do chat.js), se não existir, define a local
const API_BASE = (typeof window.API_URL !== 'undefined') ? window.API_URL : 'http://localhost:3000/api';
const SERVER_URL = 'http://localhost:3000'; // Para imagens

console.log("🚀 Portal Formador carregado! API:", API_BASE);

document.addEventListener("DOMContentLoaded", () => {
    // 1. SEGURANÇA E DADOS DO USER
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const user = JSON.parse(userStr);

        // Redirecionamentos de segurança
        if (user.role === 'Admin') window.location.href = 'dashboard.html';
        if (user.role === 'Formando') window.location.href = 'portal-aluno.html';

        // Preencher HTML com dados do user
        if(document.getElementById('nomeUser')) document.getElementById('nomeUser').textContent = user.nome || user.nome_completo;
        if(document.getElementById('userEmail')) document.getElementById('userEmail').textContent = user.email;
        if(document.getElementById('userId')) document.getElementById('userId').textContent = user.id || user.id_user;
        if(document.getElementById('roleUser')) document.getElementById('roleUser').textContent = user.role;

        // Foto de Perfil
        if (user.foto) {
             const fotoSrc = user.foto.startsWith('http') ? user.foto : `${SERVER_URL}/uploads/${user.foto}`;
             const img = document.getElementById('imgPerfil');
             if(img) img.src = fotoSrc;
        }

        // 2. CARREGAR CONTEÚDOS
        carregarMeusModulos();
        carregarMinhaDisponibilidade();

    } catch (e) {
        console.error("Erro crítico ao iniciar:", e);
        logout();
    }
});

// ==========================================
// MÓDULOS DO FORMADOR
// ==========================================
async function carregarMeusModulos() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    const tbody = document.getElementById('listaMeusModulos');
    
    // ID Seguro
    const userId = user.id || user.id_user;

    try {
        const res = await fetch(`${API_BASE}/modulos/formador/${userId}`, { 
            headers: { 'Authorization': 'Bearer ' + token } 
        });
        const modulos = await res.json();

        if (!tbody) return;
        tbody.innerHTML = '';

        if (modulos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center p-4 text-muted">Ainda não tens módulos atribuídos.</td></tr>';
            return;
        }

        modulos.forEach(m => {
            const nomeCurso = m.Curso ? `<span class="badge bg-secondary">${m.Curso.nome}</span>` : '<span class="text-danger">Sem Curso</span>';
            const nomeSala = m.Sala ? `<span class="badge bg-info text-dark">${m.Sala.nome}</span>` : '<span class="badge bg-light text-dark border">Sem Sala</span>';
            
            tbody.innerHTML += `
                <tr>
                    <td class="fw-bold text-primary">${m.nome}</td>
                    <td>${nomeCurso}</td>
                    <td>${nomeSala}</td>
                    <td>${m.descricao || '<small class="text-muted">Sem descrição</small>'}</td>
                </tr>`;
        });
    } catch (e) { console.error("Erro módulos:", e); }
}

// ==========================================
// DISPONIBILIDADE (COM LOGS DE DEBUG)
// ==========================================
async function adicionarDisponibilidade() {
    console.log("🟢 Botão 'Adicionar' clicado!"); 

    const inicio = document.getElementById('dispInicio').value;
    const fim = document.getElementById('dispFim').value;
    
    console.log(`📅 Datas: ${inicio} até ${fim}`);

    if(!inicio || !fim) return alert("Por favor, preenche a data de início e de fim.");

    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    const userId = user.id || user.id_user; // ID Seguro

    try {
        console.log("📡 A enviar pedido...");
        const res = await fetch(`${API_BASE}/disponibilidades`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ dataInicio: inicio, dataFim: fim, formadorId: userId })
        });
        
        console.log("Status Servidor:", res.status);

        if(res.ok) {
            alert("✅ Disponibilidade guardada!");
            // Limpar inputs
            document.getElementById('dispInicio').value = '';
            document.getElementById('dispFim').value = '';
            // Atualizar lista
            carregarMinhaDisponibilidade(); 
        } else {
            const err = await res.json();
            console.error("Erro Servidor:", err);
            alert("Erro: " + (err.msg || "Não foi possível guardar."));
        }
    } catch (e) { console.error("Erro JS:", e); }
}

async function carregarMinhaDisponibilidade() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    const lista = document.getElementById('listaDisponibilidade');
    const userId = user.id || user.id_user;

    if (!lista) return;

    try {
        const res = await fetch(`${API_BASE}/disponibilidades/${userId}`, { 
            headers: { 'Authorization': 'Bearer ' + token } 
        });
        const disponibilidades = await res.json();

        lista.innerHTML = '';
        if (disponibilidades.length === 0) {
            lista.innerHTML = '<li class="list-group-item text-muted text-center py-3">Ainda não definiste horários.</li>';
            return;
        }

        disponibilidades.forEach(d => {
            const inicio = new Date(d.data_inicio);
            const fim = new Date(d.data_fim);
            
            // Formatar data: "20 Maio"
            const dia = inicio.toLocaleDateString('pt-PT', {day: 'numeric', month: 'long'});
            // Formatar horas: "09:00 - 18:00"
            const horas = `${inicio.toLocaleTimeString('pt-PT', {hour:'2-digit', minute:'2-digit'})} - ${fim.toLocaleTimeString('pt-PT', {hour:'2-digit', minute:'2-digit'})}`;

            lista.innerHTML += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <i class="fas fa-calendar-alt text-success me-2"></i>
                        <span class="fw-bold text-dark">${dia}</span>
                        <span class="text-muted ms-2 small">(${horas})</span>
                    </div>
                    <button class="btn btn-sm btn-light text-danger border-0" onclick="apagarDisponibilidade(${d.id})" title="Remover">
                        <i class="fas fa-trash"></i>
                    </button>
                </li>
            `;
        });
    } catch (e) { console.error("Erro lista:", e); }
}

async function apagarDisponibilidade(id) {
    if(!confirm("Apagar este horário?")) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/disponibilidades/${id}`, { 
        method: 'DELETE', 
        headers: { 'Authorization': 'Bearer ' + token } 
    });
    carregarMinhaDisponibilidade();
}

// ==========================================
// UPLOAD FOTO E LOGOUT
// ==========================================
async function uploadFoto() {
    const input = document.getElementById('inputFoto');
    if (!input.files || !input.files[0]) return;

    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    const userId = user.id || user.id_user;
    const formData = new FormData();
    formData.append('foto', input.files[0]);
    formData.append('nome', user.nome || user.nome_completo); // Enviar nome para não apagar
    formData.append('email', user.email);

    try {
        const res = await fetch(`${API_BASE}/users/${userId}`, {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + token },
            body: formData
        });
        if(res.ok) {
            const data = await res.json();
            user.foto = data.foto;
            localStorage.setItem('user', JSON.stringify(user));
            document.getElementById('imgPerfil').src = `${SERVER_URL}/uploads/${data.foto}?t=${Date.now()}`;
            alert("Foto atualizada!");
        }
    } catch (e) { console.error(e); }
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}