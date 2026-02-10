// ==========================================
// CONFIGURAÇÃO INICIAL
// ==========================================
// Define a URL base da API
const API_BASE = 'http://localhost:3000/api';
const SERVER_URL = 'http://localhost:3000'; 

console.log("🚀 Portal Formador carregado! API:", API_BASE);

document.addEventListener("DOMContentLoaded", () => {
    // 1. Verificar Login
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) { 
        window.location.href = 'login.html'; 
        return; 
    }

    try {
        const user = JSON.parse(userStr);

        // 2. Redirecionamentos de Segurança (Quem não é formador, sai daqui)
        if (user.role === 'Admin') window.location.href = 'dashboard.html';
        if (user.role === 'Formando') window.location.href = 'portal-aluno.html';

        // 3. Preencher Dados do Perfil no HTML
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

        // 4. CARREGAR DADOS DA PÁGINA
        carregarMeusModulos();
        iniciarCalendarioDisponibilidade(); 
        iniciarCalendarioAulas();           

    } catch (e) {
        console.error("Erro crítico ao iniciar:", e);
        // logout(); // Opcional: força logout se os dados estiverem corrompidos
    }
});

// ==========================================
// FUNÇÃO: CARREGAR MÓDULOS (CORRIGIDA)
// ==========================================
async function carregarMeusModulos() {
    // Busca o user guardado e faz parse
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    
    const user = JSON.parse(userStr);
    // Garante que apanha o ID (seja id ou id_user)
    const userId = user.id || user.id_user;

    const container = document.getElementById('tabelaMeusModulos');
    if (!container) return; 

    try {
        // Usa API_BASE que definimos no topo
        const res = await fetch(`${API_BASE}/modulos?formadorId=${userId}`, {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
        });
        
        const modulos = await res.json();
        
        container.innerHTML = '';

        if (modulos.length === 0) {
            container.innerHTML = '<tr><td colspan="4" class="text-center py-3">Ainda não tens módulos atribuídos.</td></tr>';
            return;
        }

        modulos.forEach(m => {
            const nomeCurso = m.Curso ? m.Curso.nome : 'Geral';
            const nomeSala = m.Sala ? m.Sala.nome : 'Sem Sala';
            
            container.innerHTML += `
                <tr>
                    <td class="fw-bold text-primary">${m.nome}</td>
                    <td><span class="badge bg-light text-dark border">${nomeCurso}</span></td>
                    <td>${nomeSala}</td>
                    <td>${m.duracao || 0} horas</td>
                </tr>
            `;
        });

    } catch (error) {
        console.error("Erro ao carregar módulos:", error);
        container.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Erro ao carregar dados.</td></tr>';
    }
}

// ==========================================
// CALENDÁRIO 1: DISPONIBILIDADE (VERDE)
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
        height: 'auto', // Ajusta altura automaticamente
        
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
                    color: '#198754'
                }));
                successCallback(eventos);
            } catch (e) { failureCallback(e); }
        },

        select: async (info) => {
            if (confirm(`Marcar disponibilidade das ${info.start.toLocaleTimeString()} às ${info.end.toLocaleTimeString()}?`)) {
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
// CALENDÁRIO 2: AULAS (AZUL)
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
        height: 'auto',
        
        events: async (info, successCallback, failureCallback) => {
            try {
                const res = await fetch(`${API_BASE}/horarios?userId=${userId}`, { 
                headers: { 'Authorization': 'Bearer ' + token } 
            });
                const horarios = await res.json();
                
                const eventos = horarios.map(h => ({
                    id: h.id_horario,
                    title: `AULA: ${h.Modulo ? h.Modulo.nome : 'Módulo'} (${h.Sala ? h.Sala.nome : '?'})`,
                    start: `${h.data_aula.split('T')[0]}T${h.hora_inicio}`,
                    end: `${h.data_aula.split('T')[0]}T${h.hora_fim}`,
                    color: '#0d6efd'
                }));
                successCallback(eventos);
            } catch (e) { failureCallback(e); }
        },

        eventClick: (info) => {
            alert(`Detalhes da Aula:\n${info.event.title}\nInício: ${info.event.start.toLocaleTimeString()}\nFim: ${info.event.end.toLocaleTimeString()}`);
        }
    });
    calendar.render();
}

// Função Upload Foto
async function uploadFoto() {
    const input = document.getElementById('inputFoto');
    if (!input.files || !input.files[0]) return;

    const user = JSON.parse(localStorage.getItem('user'));
    const userId = user.id || user.id_user;
    const token = localStorage.getItem('token');

    const formData = new FormData();
    formData.append('foto', input.files[0]);
    // Envia nome/email para não dar erro se o backend validar obrigatoriedade
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
            // Atualiza localstorage com a nova foto
            user.foto = data.foto || data.user.foto; 
            localStorage.setItem('user', JSON.stringify(user));
            
            // Atualiza imagem na hora
            document.getElementById('imgPerfil').src = `${SERVER_URL}/uploads/${user.foto}?t=${Date.now()}`;
            alert("Foto atualizada!");
        } else {
            alert("Erro ao enviar foto.");
        }
    } catch (e) { console.error(e); }
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}