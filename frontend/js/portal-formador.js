// ==========================================
// CONFIGURAÇÃO INICIAL
// ==========================================
const API_BASE = (typeof window.API_URL !== 'undefined') ? window.API_URL : 'http://localhost:3000/api';
const SERVER_URL = 'http://localhost:3000'; 

console.log("🚀 Portal Formador carregado! API:", API_BASE);

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) { window.location.href = 'login.html'; return; }

    try {
        const user = JSON.parse(userStr);

        // Redirecionamentos de Segurança
        if (user.role === 'Admin') window.location.href = 'dashboard.html';
        if (user.role === 'Formando') window.location.href = 'portal-aluno.html';

        // Preencher HTML
        if(document.getElementById('nomeUser')) document.getElementById('nomeUser').textContent = user.nome || user.nome_completo;
        if(document.getElementById('userEmail')) document.getElementById('userEmail').textContent = user.email;
        if(document.getElementById('userId')) document.getElementById('userId').textContent = user.id || user.id_user;
        if(document.getElementById('roleUser')) document.getElementById('roleUser').textContent = user.role;

        // Foto
        if (user.foto) {
             const fotoSrc = user.foto.startsWith('http') ? user.foto : `${SERVER_URL}/uploads/${user.foto}`;
             const img = document.getElementById('imgPerfil');
             if(img) img.src = fotoSrc;
        }

        // --- CARREGAR TUDO ---
        carregarMeusModulos();
        iniciarCalendarioDisponibilidade(); // Calendário Verde (Editar)
        iniciarCalendarioAulas();           // Calendário Azul (Ver)

    } catch (e) {
        console.error("Erro crítico:", e);
        logout();
    }
});

// ==========================================
// 1. CALENDÁRIO DE DISPONIBILIDADE (VERDE - EDITÁVEL)
// ==========================================
function iniciarCalendarioDisponibilidade() {
    const calendarEl = document.getElementById('calendarDisponibilidade');
    if (!calendarEl) return;

    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    const userId = user.id || user.id_user;

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        locale: 'pt',
        headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek' },
        slotMinTime: '08:00:00',
        slotMaxTime: '23:00:00',
        allDaySlot: false,
        selectable: true,
        selectMirror: true,
        height: '100%',
        
        // Carregar Disponibilidades
        events: async (info, successCallback, failureCallback) => {
            try {
                const res = await fetch(`${API_BASE}/disponibilidades/${userId}`, { 
                    headers: { 'Authorization': 'Bearer ' + token } 
                });
                const dados = await res.json();
                
                const eventos = dados.map(d => ({
                    id: d.id,
                    title: 'Disponível',
                    start: d.data_inicio,
                    end: d.data_fim,
                    color: '#198754', // Verde
                    display: 'block'
                }));
                successCallback(eventos);
            } catch (e) { failureCallback(e); }
        },

        // Criar (Arrastar)
        select: async (info) => {
            if (confirm(`Marcar disponibilidade?`)) {
                try {
                    const res = await fetch(`${API_BASE}/disponibilidades`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
                        body: JSON.stringify({ dataInicio: info.startStr, dataFim: info.endStr, formadorId: userId })
                    });
                    if (res.ok) calendar.refetchEvents();
                } catch (e) { console.error(e); }
            }
            calendar.unselect();
        },

        // Apagar (Clicar)
        eventClick: async (info) => {
            if (confirm("Remover esta disponibilidade?")) {
                try {
                    await fetch(`${API_BASE}/disponibilidades/${info.event.id}`, { 
                        method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } 
                    });
                    info.event.remove();
                } catch (e) { console.error(e); }
            }
        }
    });
    calendar.render();
}

// ==========================================
// 2. CALENDÁRIO DE AULAS (AZUL - SÓ LEITURA)
// ==========================================
function iniciarCalendarioAulas() {
    const calendarEl = document.getElementById('calendarHorario');
    if (!calendarEl) return;

    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    const userId = user.id || user.id_user;

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'timeGridWeek',
        locale: 'pt',
        headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek' },
        slotMinTime: '08:00:00',
        slotMaxTime: '23:00:00',
        allDaySlot: false,
        height: '100%',
        
        // Carregar Aulas (Filtradas pelo ID do Formador)
        events: async (info, successCallback, failureCallback) => {
            try {
                // Usamos a rota de horarios com filtro ?formadorId=X
                const res = await fetch(`${API_BASE}/horarios?formadorId=${userId}`, { 
                    headers: { 'Authorization': 'Bearer ' + token } 
                });
                const horarios = await res.json();
                
                const eventos = horarios.map(h => {
                    const nomeModulo = h.Modulo ? h.Modulo.nome : 'Módulo Removido';
                    const nomeSala = h.Sala ? h.Sala.nome : 'Sem Sala';
                    
                    return {
                        id: h.id_horario,
                        title: `AULA: ${nomeModulo} (${nomeSala})`,
                        start: `${h.data_aula.split('T')[0]}T${h.hora_inicio}`,
                        end: `${h.data_aula.split('T')[0]}T${h.hora_fim}`,
                        color: '#0d6efd', // Azul
                        textColor: '#ffffff'
                    };
                });
                successCallback(eventos);
            } catch (e) { 
                console.error("Erro ao carregar aulas:", e);
                failureCallback(e); 
            }
        },

        // Clique no evento (Apenas mostra info, não apaga)
        eventClick: (info) => {
            alert(`Detalhes:\n${info.event.title}\nInício: ${info.event.start.toLocaleTimeString()}\nFim: ${info.event.end.toLocaleTimeString()}`);
        }
    });
    calendar.render();
}

// ==========================================
// MÓDULOS E OUTROS
// ==========================================
async function carregarMeusModulos() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    const tbody = document.getElementById('listaMeusModulos');
    const userId = user.id || user.id_user;

    try {
        const res = await fetch(`${API_BASE}/modulos/formador/${userId}`, { headers: { 'Authorization': 'Bearer ' + token } });
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
            tbody.innerHTML += `<tr><td class="fw-bold text-primary">${m.nome}</td><td>${nomeCurso}</td><td>${nomeSala}</td><td>${m.descricao || '-'}</td></tr>`;
        });
    } catch (e) { console.error("Erro módulos:", e); }
}

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
            method: 'PUT', headers: { 'Authorization': 'Bearer ' + token }, body: formData
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

function logout() { localStorage.clear(); window.location.href = 'login.html'; }