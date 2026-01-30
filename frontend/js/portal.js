// ==========================================
// CONFIGURAÇÃO INICIAL
// ==========================================
const API_BASE = (typeof window.API_URL !== 'undefined') ? window.API_URL : 'http://localhost:3000/api';
const SERVER_URL = 'http://localhost:3000'; 

console.log("🎓 Portal Aluno carregado! API:", API_BASE);

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) { window.location.href = 'login.html'; return; }

    try {
        const user = JSON.parse(userStr);

        // Segurança
        if (user.role === 'Admin') window.location.href = 'dashboard.html';
        if (user.role === 'Formador') window.location.href = 'portal-formador.html';

        // Preencher Dados no HTML
        if(document.getElementById('nomeAluno')) document.getElementById('nomeAluno').textContent = user.nome || user.nome_completo;
        if(document.getElementById('userEmail')) document.getElementById('userEmail').textContent = user.email;
        if(document.getElementById('userId')) document.getElementById('userId').textContent = user.id || user.id_user;

        // Força a aparecer o Role (Cargo) em vez do Curso
        if(document.getElementById('cursoAluno')) {
            document.getElementById('cursoAluno').textContent = user.role || "Formando";
        }

        // Foto
        if (user.foto) {
             const fotoSrc = user.foto.startsWith('http') ? user.foto : `${SERVER_URL}/uploads/${user.foto}`;
             const img = document.getElementById('imgPerfil');
             if(img) img.src = fotoSrc;
        }

        // --- INICIAR FUNÇÕES ---
        carregarTabelaInscricoes(); 
        iniciarCalendarioAluno();   

    } catch (e) {
        console.error("Erro crítico:", e);
        logout();
    }
});

// ==========================================
// 1. TABELA DE CURSOS E CANDIDATURAS
// ==========================================
async function carregarTabelaInscricoes() {
    const tbody = document.getElementById('listaCursosCandidatura');
    if (!tbody) return;

    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    const userId = user.id || user.id_user;

    try {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">A carregar cursos...</td></tr>';

        // Usa a rota "inteligente" que já diz o estado da inscrição
        const res = await fetch(`${API_BASE}/cursos/disponiveis/${userId}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (res.ok) {
            const cursos = await res.json();
            tbody.innerHTML = ''; 

            if(cursos.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center">Não há cursos disponíveis.</td></tr>';
                return;
            }

            cursos.forEach(curso => {
                const dataInicio = new Date(curso.inicio || Date.now()).toLocaleDateString('pt-PT');
                let estadoBadge = '';
                let acaoBtn = '';

                // Verifica o estado que veio do backend
                if (curso.estado_inscricao === 'Aceite') {
                    estadoBadge = '<span class="badge bg-success">Matriculado</span>';
                    acaoBtn = '<button class="btn btn-sm btn-outline-success" disabled><i class="fas fa-check"></i> Inscrito</button>';
                    
                    // --- CORREÇÃO: REMOVEMOS A LINHA QUE MUDAVA O TEXTO DEBAIXO DA FOTO ---
                    // Antes estava aqui uma linha que dizia document.getElementById('cursoAluno').textContent = curso.nome;
                    // Agora apagámos para manter "Formando".

                } else if (curso.estado_inscricao === 'Pendente') {
                    estadoBadge = '<span class="badge bg-warning text-dark">Pendente</span>';
                    acaoBtn = '<button class="btn btn-sm btn-secondary" disabled><i class="fas fa-clock"></i> Aguarda</button>';

                } else {
                    estadoBadge = '<span class="badge bg-info text-dark">Disponível</span>';
                    acaoBtn = `<button class="btn btn-sm btn-primary" onclick="fazerCandidatura(${curso.id_curso}, '${curso.nome}')">Candidatar</button>`;
                }

                tbody.innerHTML += `
                    <tr>
                        <td class="fw-bold text-primary">${curso.nome}</td>
                        <td><span class="badge bg-secondary">${curso.area}</span></td>
                        <td>${dataInicio}</td>
                        <td>${estadoBadge}</td>
                        <td>${acaoBtn}</td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Erro ao carregar cursos.</td></tr>';
        }
    } catch (e) {
        console.error("Erro tabela:", e);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Erro de ligação.</td></tr>';
    }
}

// Função para o botão "Candidatar"
async function fazerCandidatura(cursoId, nomeCurso) {
    if(!confirm(`Queres candidatar-te ao curso de ${nomeCurso}?`)) return;

    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    const userId = user.id || user.id_user;

    try {
        const res = await fetch(`${API_BASE}/inscricoes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ alunoId: userId, cursoId: cursoId })
        });

        if(res.ok) {
            alert("✅ Candidatura enviada!");
            carregarTabelaInscricoes(); // Atualiza a tabela sem recarregar tudo
        } else {
            const err = await res.json();
            alert("Erro: " + (err.msg || "Erro ao candidatar."));
        }
    } catch (e) { console.error(e); }
}

// ==========================================
// 2. CALENDÁRIO
// ==========================================
async function iniciarCalendarioAluno() {
    const calendarEl = document.getElementById('calendarAluno');
    if (!calendarEl) return;

    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    const userId = user.id || user.id_user;

    let cursoId = null;
    try {
        const res = await fetch(`${API_BASE}/inscricoes/aluno/${userId}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.ok) {
            const curso = await res.json();
            cursoId = curso.id_curso; 
        } 
    } catch (e) { return; }

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        locale: 'pt',
        headerToolbar: { 
            left: 'prev,next today', 
            center: 'title', 
            right: 'dayGridMonth,timeGridWeek' 
        },
        slotMinTime: '08:00:00',
        slotMaxTime: '23:00:00',
        allDaySlot: false,
        height: 'auto',
        
        events: async (info, successCallback, failureCallback) => {
            try {
                if(!cursoId) return successCallback([]); 
                const url = `${API_BASE}/horarios?cursoId=${cursoId}`;
                const res = await fetch(url, { headers: { 'Authorization': 'Bearer ' + token } });
                const horarios = await res.json();
                
                const eventos = horarios.map(h => ({
                    id: h.id_horario,
                    title: `${h.Modulo?.nome} (${h.Sala?.nome})`, 
                    start: `${h.data_aula.split('T')[0]}T${h.hora_inicio}`,
                    end: `${h.data_aula.split('T')[0]}T${h.hora_fim}`,
                    color: '#6f42c1', 
                    textColor: '#ffffff'
                }));
                successCallback(eventos);
            } catch (e) { failureCallback(e); }
        },
        eventClick: (info) => {
            alert(`Aula: ${info.event.title}\nInício: ${info.event.start.toLocaleTimeString()}`);
        }
    });

    calendar.render();
}

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================
async function uploadFoto() {
    const input = document.getElementById('inputFoto');
    if (!input.files || !input.files[0]) return;
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    const userId = user.id || user.id_user;
    
    const formData = new FormData();
    formData.append('foto', input.files[0]);
    formData.append('nome', user.nome || user.nome_completo);
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
            location.reload(); 
        }
    } catch (e) { console.error(e); }
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}