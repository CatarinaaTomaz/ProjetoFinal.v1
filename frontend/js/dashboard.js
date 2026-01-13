const API_URL = 'http://localhost:3000/api';

document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // 1. INICIALIZAÇÃO E SEGURANÇA
    // ==========================================

    // CAPTURAR DADOS NOVOS QUE VÊM DA URL (Google/Facebook)
    const params = new URLSearchParams(window.location.search);
    const tokenUrl = params.get('token');
    const userUrl = params.get('user');

    if (tokenUrl && userUrl) {
        console.log("Login Social detetado! Atualizando dados...");
        localStorage.setItem('token', tokenUrl);
        localStorage.setItem('user', decodeURIComponent(userUrl));
        window.history.replaceState({}, document.title, "dashboard.html");
    }

    // LER DADOS DA MEMÓRIA
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        window.location.href = 'login.html';
        return;
    }

    const user = JSON.parse(userStr);
    
    // LOG DE DEBUG (Para veres quem está logado)
    console.log("User Logado:", user.nome, "| Role:", user.role);

    // BLOQUEIO DE ALUNOS: Se não for Admin, manda para o Portal
    if (user.role !== 'Admin') {
        console.warn("Acesso negado. Redirecionando para o Portal do Aluno...");
        window.location.href = 'portal-aluno.html';
        return; 
    }

    // Configurar o botão de esconder menu
    const el = document.getElementById("wrapper");
    const toggleButton = document.getElementById("menu-toggle");
    if(toggleButton) {
        toggleButton.onclick = function () {
            el.classList.toggle("toggled");
        };
    }

    // Carregar conteúdo inicial
    carregarConteudo('inicio');
});

// ==========================================
// 2. ROUTER (NAVEGAÇÃO)
// ==========================================
async function carregarConteudo(tipo) {
    const conteudo = document.getElementById('conteudo-principal');
    const titulo = document.getElementById('titulo-seccao');

    // --- PÁGINA INICIAL ---
    if (tipo === 'inicio') {
        titulo.innerText = 'Visão Geral';
        conteudo.innerHTML = `
            <div class="row g-3">
                <div class="col-md-3">
                    <div class="p-3 bg-white shadow-sm d-flex justify-content-around align-items-center rounded border-start border-4 border-primary">
                        <div><h3 class="fs-2">0</h3><p class="fs-5 text-muted">Cursos</p></div>
                        <i class="fas fa-book fs-1 text-primary"></i>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="p-3 bg-white shadow-sm d-flex justify-content-around align-items-center rounded border-start border-4 border-success">
                        <div><h3 class="fs-2">0</h3><p class="fs-5 text-muted">Turmas</p></div>
                        <i class="fas fa-users fs-1 text-success"></i>
                    </div>
                </div>
            </div>
            <div class="mt-5 alert alert-light border">
                <h4>Bem-vindo ao Portal ATEC!</h4>
                <p>Usa o menu lateral para gerir a escola.</p>
            </div>
        `;
    } 
    
    // --- PÁGINA UTILIZADORES ---
    else if (tipo === 'utilizadores') {
        titulo.innerText = 'Gestão de Utilizadores';
        conteudo.innerHTML = `
            <div class="card shadow-sm border-0">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle">
                            <thead class="table-dark">
                                <tr>
                                    <th>ID</th>
                                    <th>Nome</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Origem</th>
                                    <th>Estado</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody id="tabelaUsers">
                                <tr><td colspan="7" class="text-center">A carregar...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        await preencherTabelaUtilizadores();
    }

    // --- PÁGINA CURSOS (NOVO!) ---
    else if (tipo === 'cursos') {
        titulo.innerText = 'Gestão de Cursos';
        conteudo.innerHTML = `
            <button class="btn btn-success mb-3 shadow-sm" onclick="abrirModalCurso()">
                <i class="fas fa-plus me-2"></i>Novo Curso
            </button>
            <div class="card shadow-sm border-0">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle">
                            <thead class="table-dark">
                                <tr>
                                    <th>ID</th>
                                    <th>Nome</th>
                                    <th>Área</th>
                                    <th>Início</th>
                                    <th>Fim</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody id="tabelaCursos">
                                <tr><td colspan="6" class="text-center">A carregar...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        await preencherTabelaCursos();
    }
}

// ==========================================
// 3. LÓGICA DE UTILIZADORES
// ==========================================
async function preencherTabelaUtilizadores() {
    const token = localStorage.getItem('token');
    const tabela = document.getElementById('tabelaUsers');

    try {
        const res = await fetch(`${API_URL}/users`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const users = await res.json();
        
        tabela.innerHTML = ''; 

        users.forEach(user => {
            let loginIcon = '<i class="fas fa-envelope text-secondary"></i>';
            if (user.googleId) loginIcon = '<i class="fab fa-google text-danger"></i>';
            else if (user.facebookId) loginIcon = '<i class="fab fa-facebook text-primary"></i>';

            const corBadge = user.conta_ativa ? 'success' : 'danger';
            const textoBadge = user.conta_ativa ? 'Ativo' : 'Inativo';
            const nomeSafe = user.nome_completo.replace(/'/g, "&#39;");
            const roleId = user.Role ? user.Role.id_role : 2;
            const roleNome = user.Role ? user.Role.descricao : 'Sem Role';

            const linha = `
                <tr>
                    <td>#${user.id_user}</td>
                    <td class="fw-bold">${user.nome_completo}</td>
                    <td>${user.email}</td>
                    <td><span class="badge bg-info text-dark">${roleNome}</span></td>
                    <td class="text-center">${loginIcon}</td>
                    <td>
                        <span class="badge bg-${corBadge}" style="cursor:pointer" onclick="alterarEstado(${user.id_user})">
                            ${textoBadge} <i class="fas fa-sync-alt ms-1 small"></i>
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-warning text-white" 
                            onclick="abrirModalUser(${user.id_user}, '${nomeSafe}', '${user.email}', ${roleId})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="eliminarUser(${user.id_user})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            tabela.innerHTML += linha;
        });
    } catch (error) {
        tabela.innerHTML = '<tr><td colspan="7" class="text-danger text-center">Erro ao carregar dados.</td></tr>';
    }
}

// Funções de Ação (User)
function abrirModalUser(id, nome, email, roleId) {
    document.getElementById('editId').value = id;
    document.getElementById('editNome').value = nome;
    document.getElementById('editEmail').value = email;
    document.getElementById('editRole').value = roleId;
    const modal = new bootstrap.Modal(document.getElementById('modalEditarUser'));
    modal.show();
}

async function guardarEdicaoUser() {
    const id = document.getElementById('editId').value;
    const nome = document.getElementById('editNome').value;
    const email = document.getElementById('editEmail').value;
    const roleId = document.getElementById('editRole').value;
    const token = localStorage.getItem('token');

    try {
        const res = await fetch(`${API_URL}/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ nome, email, roleId })
        });
        if (res.ok) {
            alert('Guardado com sucesso!');
            bootstrap.Modal.getInstance(document.getElementById('modalEditarUser')).hide();
            preencherTabelaUtilizadores();
        } else alert('Erro ao guardar.');
    } catch (error) { console.error(error); }
}

async function alterarEstado(id) {
    const token = localStorage.getItem('token');
    try {
        await fetch(`${API_URL}/users/${id}/status`, {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        preencherTabelaUtilizadores();
    } catch (error) { alert('Erro na ligação'); }
}

async function eliminarUser(id) {
    if(!confirm("Tem a certeza?")) return;
    const token = localStorage.getItem('token');
    try {
        await fetch(`${API_URL}/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        preencherTabelaUtilizadores();
    } catch (error) { alert('Erro ao eliminar'); }
}

// ==========================================
// 4. LÓGICA DE CURSOS 
// ==========================================
async function preencherTabelaCursos() {
    const token = localStorage.getItem('token');
    const tabela = document.getElementById('tabelaCursos');

    try {
        const res = await fetch(`${API_URL}/cursos`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const cursos = await res.json();
        
        tabela.innerHTML = '';

        if (cursos.length === 0) {
            tabela.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Nenhum curso encontrado.</td></tr>';
            return;
        }

        cursos.forEach(curso => {
            const inicio = new Date(curso.data_inicio).toLocaleDateString('pt-PT');
            const fim = new Date(curso.data_fim).toLocaleDateString('pt-PT');

            const linha = `
                <tr>
                    <td>#${curso.id_curso}</td>
                    <td class="fw-bold">${curso.nome}</td>
                    <td><span class="badge bg-secondary">${curso.area}</span></td>
                    <td>${inicio}</td>
                    <td>${fim}</td>
                    <td>
                        <button class="btn btn-sm btn-warning text-white" 
                            onclick="abrirModalCurso(${curso.id_curso}, '${curso.nome}', '${curso.area}', '${curso.data_inicio}', '${curso.data_fim}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="eliminarCurso(${curso.id_curso})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            tabela.innerHTML += linha;
        });
    } catch (error) {
        tabela.innerHTML = '<tr><td colspan="6" class="text-danger text-center">Erro ao carregar cursos.</td></tr>';
    }
}

function abrirModalCurso(id = null, nome = '', area = 'Informática', inicio = '', fim = '') {
    document.getElementById('cursoId').value = id || '';
    document.getElementById('cursoNome').value = nome;
    document.getElementById('cursoArea').value = area;
    
    // Tratamento de datas para o input type="date"
    if(inicio) document.getElementById('cursoInicio').value = inicio.split('T')[0];
    else document.getElementById('cursoInicio').value = '';

    if(fim) document.getElementById('cursoFim').value = fim.split('T')[0];
    else document.getElementById('cursoFim').value = '';

    document.getElementById('tituloModalCurso').innerText = id ? 'Editar Curso' : 'Novo Curso';
    const modal = new bootstrap.Modal(document.getElementById('modalCurso'));
    modal.show();
}

async function guardarCurso() {
    const id = document.getElementById('cursoId').value;
    const nome = document.getElementById('cursoNome').value;
    const area = document.getElementById('cursoArea').value;
    const data_inicio = document.getElementById('cursoInicio').value;
    const data_fim = document.getElementById('cursoFim').value;
    const token = localStorage.getItem('token');

    const metodo = id ? 'PUT' : 'POST'; 
    const url = id ? `${API_URL}/cursos/${id}` : `${API_URL}/cursos`;

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ nome, area, data_inicio, data_fim })
        });

        if (res.ok) {
            alert('Curso guardado com sucesso!');
            bootstrap.Modal.getInstance(document.getElementById('modalCurso')).hide();
            preencherTabelaCursos();
        } else {
            alert('Erro ao guardar curso.');
        }
    } catch (error) { console.error(error); }
}

async function eliminarCurso(id) {
    if(!confirm("Tens a certeza que queres eliminar este curso?")) return;
    const token = localStorage.getItem('token');
    try {
        await fetch(`${API_URL}/cursos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        preencherTabelaCursos();
    } catch (error) { alert('Erro ao eliminar'); }
}

// ==========================================
// 5. UTILITÁRIOS
// ==========================================
function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}
