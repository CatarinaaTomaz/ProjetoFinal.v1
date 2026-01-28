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

        // Preencher Dados
        if(document.getElementById('nomeUser')) document.getElementById('nomeUser').textContent = user.nome || user.nome_completo;
        
        // Foto
        if (user.foto) {
             const fotoSrc = user.foto.startsWith('http') ? user.foto : `${SERVER_URL}/uploads/${user.foto}`;
             const img = document.getElementById('imgPerfil');
             if(img) img.src = fotoSrc;
        }

        // --- INICIAR CALENDÁRIO ---
        iniciarCalendarioAluno();

    } catch (e) {
        console.error("Erro crítico:", e);
        logout();
    }
});

// ==========================================
// LÓGICA DO CALENDÁRIO DO ALUNO
// ==========================================
async function iniciarCalendarioAluno() {
    const calendarEl = document.getElementById('calendarAluno');
    if (!calendarEl) return;

    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    const userId = user.id || user.id_user;

    // 1. Descobrir o Curso do Aluno
    let cursoId = null;
    try {
        const res = await fetch(`${API_BASE}/inscricoes/aluno/${userId}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (res.ok) {
            const curso = await res.json();
            cursoId = curso.id_curso; // Guardamos o ID do curso
            console.log(`🎓 Aluno pertence ao curso: ${curso.nome} (ID: ${cursoId})`);
        } else {
            console.warn("Aluno sem matrícula ativa.");
            calendarEl.innerHTML = '<div class="alert alert-warning">Não estás inscrito em nenhum curso.</div>';
            return;
        }
    } catch (e) {
        console.error("Erro ao buscar curso do aluno:", e);
        return;
    }

    // 2. Configurar Calendário
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
        height: '100%',
        
        // 3. Buscar Horários (Filtrando pelo Curso ID que descobrimos)
        events: async (info, successCallback, failureCallback) => {
            try {
                // Truque: Usamos o filtro ?cursoId=X na rota de horários
                const url = `${API_BASE}/horarios?cursoId=${cursoId}`;
                
                const res = await fetch(url, { headers: { 'Authorization': 'Bearer ' + token } });
                const horarios = await res.json();
                
                const eventos = horarios.map(h => {
                    const nomeModulo = h.Modulo ? h.Modulo.nome : 'Módulo';
                    const nomeSala = h.Sala ? h.Sala.nome : 'Sala ?';
                    const nomeFormador = (h.Modulo && h.Modulo.Formador) ? h.Modulo.Formador.nome_completo.split(' ')[0] : '';

                    return {
                        id: h.id_horario,
                        title: `${nomeModulo} (${nomeSala})`, // Título do evento
                        description: `Formador: ${nomeFormador}`,
                        start: `${h.data_aula.split('T')[0]}T${h.hora_inicio}`,
                        end: `${h.data_aula.split('T')[0]}T${h.hora_fim}`,
                        color: '#6f42c1', // Roxo (Cor diferente para alunos)
                        textColor: '#ffffff'
                    };
                });
                successCallback(eventos);
            } catch (e) { failureCallback(e); }
        },

        // Clique no evento (Ver Detalhes)
        eventClick: (info) => {
            alert(`📅 AULA\n\n${info.event.title}\n${info.event.extendedProps.description || ''}\n\nHorário: ${info.event.start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - ${info.event.end.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`);
        }
    });

    calendar.render();
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}