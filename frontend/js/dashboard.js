const API_URL = 'http://localhost:3000/api';

// ==========================================
// VARIÁVEIS GLOBAIS (Para as pesquisas)
// ==========================================
let todosUtilizadores = [];
let todosCursos = [];
let todosModulos = []; 

document.addEventListener("DOMContentLoaded", async () => {
    
    // ==========================================
    // 1. PROCESSAR LOGIN SOCIAL
    // ==========================================
    const params = new URLSearchParams(window.location.search);
    const tokenUrl = params.get('token');
    const userUrl = params.get('user');

    if (tokenUrl && userUrl) {
        try {
            const userStringDecoded = decodeURIComponent(userUrl);
            const userData = JSON.parse(userStringDecoded);
            localStorage.setItem('token', tokenUrl);
            localStorage.setItem('user', JSON.stringify(userData));
            window.history.replaceState({}, document.title, "dashboard.html");
        } catch (error) {
            console.error("Erro login social:", error);
        }
    }

    // ==========================================
    // 2. VERIFICAÇÃO DE SEGURANÇA E ROLES
    // ==========================================
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        window.location.href = 'login.html';
        return;
    }

    let user;
    try { 
        user = JSON.parse(userStr); 
    } catch (e) { 
        logout(); 
        return; 
    }

    // BLOQUEIO: Só Admin e Secretaria entram aqui
    const rolesPermitidas = ['Admin', 'Secretaria'];
    
    if (!rolesPermitidas.includes(user.role)) {
        console.warn("Acesso negado. Redirecionando...");
        if (user.role === 'Formador') window.location.href = 'portal-formador.html';
        else window.location.href = 'portal-aluno.html';
        return; 
    }

    // ==========================================
    // 3. INICIALIZAR O DASHBOARD
    // ==========================================
    
    // Nome e Role no Topo
    const topoNome = document.getElementById('topo-nome-user');
    if(topoNome) {
        topoNome.innerHTML = `${user.nome || user.nome_completo} <small class="text-white-50">(${user.role})</small>`;
    }

    // Configurar menu lateral
    const toggleButton = document.getElementById("menu-toggle");
    if(toggleButton) {
        toggleButton.onclick = function () {
            document.getElementById("wrapper").classList.toggle("toggled");
        };
    }

    // Carregar conteúdo inicial
    carregarConteudo('inicio');
});

// ==========================================
// 4. ROUTER (NAVEGAÇÃO)
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
                        <div>
                            <h3 class="fs-2" id="total-cursos">...</h3>
                            <p class="fs-5 text-muted">Cursos</p>
                        </div>
                        <i class="fas fa-book fs-1 text-primary"></i>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="p-3 bg-white shadow-sm d-flex justify-content-around align-items-center rounded border-start border-4 border-success">
                        <div>
                            <h3 class="fs-2" id="total-turmas">0</h3>
                            <p class="fs-5 text-muted">Turmas</p>
                        </div>
                        <i class="fas fa-users fs-1 text-success"></i>
                    </div>
                </div>
            </div>
            <div class="mt-5 alert alert-light border">
                <h4>Bem-vindo ao Portal ATEC!</h4>
                <p>Painel de Gestão Escolar.</p>
            </div>
        `;
        atualizarEstatisticas();
    } 
    
    // --- PÁGINA UTILIZADORES ---
    else if (tipo === 'utilizadores') {
        titulo.innerText = 'Gestão de Utilizadores';
        conteudo.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <div class="input-group shadow-sm">
                        <span class="input-group-text bg-white border-end-0"><i class="fas fa-search text-muted"></i></span>
                        <input type="text" class="form-control border-start-0" id="pesquisaUser" placeholder="Pesquisar utilizador..." onkeyup="filtrarUtilizadores()">
                    </div>
                </div>
            </div>

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

    // --- PÁGINA CURSOS ---
    else if (tipo === 'cursos') {
        titulo.innerText = 'Gestão de Cursos';
        conteudo.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <button class="btn btn-success shadow-sm" onclick="abrirModalCurso()">
                    <i class="fas fa-plus me-2"></i>Novo Curso
                </button>
            </div>

            <div class="row mb-3">
                <div class="col-md-6">
                    <div class="input-group shadow-sm">
                        <span class="input-group-text bg-white border-end-0"><i class="fas fa-search text-muted"></i></span>
                        <input type="text" class="form-control border-start-0" id="pesquisaCurso" placeholder="Pesquisar curso por nome ou área..." onkeyup="filtrarCursos()">
                    </div>
                </div>
            </div>

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

    // --- PÁGINA MÓDULOS (NOVA) ---
    else if (tipo === 'modulos') {
        titulo.innerText = 'Gestão de Módulos';
        conteudo.innerHTML = `
            <div class="alert alert-info border-start border-4 border-info">
                <i class="fas fa-info-circle me-2"></i>Primeiro seleciona um curso para ver e gerir os seus módulos.
            </div>
            
            <div class="row mb-4">
                <div class="col-md-6">
                    <label class="form-label fw-bold">Selecionar Curso:</label>
                    <select class="form-select shadow-sm" id="filtroCursoModulo" onchange="carregarModulosDoCurso()">
                        <option value="">-- Escolhe um curso --</option>
                    </select>
                </div>
                <div class="col-md-6 d-flex align-items-end">
                    <button class="btn btn-warning text-dark w-100 shadow-sm" id="btnNovoModulo" onclick="abrirModalModulo()" disabled>
                        <i class="fas fa-plus me-2"></i>Adicionar Módulo ao Curso
                    </button>
                </div>
            </div>

            <div class="card shadow-sm border-0">
                <div class="card-body">
                    <h5 class="card-title mb-3 text-secondary" id="tituloListaModulos">Lista de Módulos</h5>
                    <div class="table-responsive">
                        <table class="table table-hover align-middle">
                            <thead class="table-light">
                                <tr>
                                    <th>ID</th>
                                    <th>Nome do Módulo</th>
                                    <th>Descrição</th>
                                    <th class="text-end">Ações</th>
                                </tr>
                            </thead>
                            <tbody id="tabelaModulos">
                                <tr><td colspan="4" class="text-center text-muted">Seleciona um curso acima.</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        // Carrega a lista de cursos para o dropdown
        await preencherSelectCursos();
    }
}

// ==========================================
// 5. ESTATÍSTICAS
// ==========================================
async function atualizarEstatisticas() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/cursos`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if(res.ok) {
            const cursos = await res.json();
            const contadorElement = document.getElementById('total-cursos');
            if(contadorElement) {
                contadorElement.innerText = cursos.length;
            }
        }
    } catch (error) {
        console.error("Erro ao carregar estatísticas", error);
    }
}

// ==========================================
// 6. LÓGICA DE UTILIZADORES
// ==========================================

async function preencherTabelaUtilizadores() {
    const token = localStorage.getItem('token');
    
    try {
        const res = await fetch(`${API_URL}/users`, { headers: { 'Authorization': 'Bearer ' + token } });
        if (!res.ok) throw new Error("Erro na API");
        
        todosUtilizadores = await res.json();
        desenharTabelaUsers(todosUtilizadores);

    } catch (error) {
        console.error(error);
        const tabela = document.getElementById('tabelaUsers');
        if(tabela) tabela.innerHTML = '<tr><td colspan="7" class="text-danger text-center">Erro ao carregar dados.</td></tr>';
    }
}

function desenharTabelaUsers(listaUsers) {
    const tabela = document.getElementById('tabelaUsers');
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const isAdmin = (currentUser.role === 'Admin');

    if (!tabela) return;

    tabela.innerHTML = ''; 

    if (listaUsers.length === 0) {
        tabela.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Nenhum utilizador encontrado.</td></tr>';
        return;
    }

    listaUsers.forEach(user => {
        let loginIcon = '<i class="fas fa-envelope text-secondary"></i>';
        if (user.googleId) loginIcon = '<i class="fab fa-google text-danger"></i>';
        else if (user.facebookId) loginIcon = '<i class="fab fa-facebook text-primary"></i>';

        const corBadge = user.conta_ativa ? 'success' : 'danger';
        const textoBadge = user.conta_ativa ? 'Ativo' : 'Inativo';
        const nomeSafe = user.nome_completo ? user.nome_completo.replace(/'/g, "&#39;") : "Sem Nome";
        const roleNome = user.Role ? user.Role.descricao : 'Sem Role';
        const roleId = user.Role ? user.Role.id_role : 2;

        let accoesHTML = '';
        if (isAdmin) {
            accoesHTML = `
                <button class="btn btn-sm btn-warning text-white" 
                    onclick="abrirModalUser(${user.id_user}, '${nomeSafe}', '${user.email}', ${roleId})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="eliminarUser(${user.id_user})">
                    <i class="fas fa-trash"></i>
                </button>
            `;
        } else {
            accoesHTML = `<span class="text-muted" title="Apenas leitura"><i class="fas fa-lock"></i></span>`;
        }

        let estadoHTML = isAdmin 
            ? `<span class="badge bg-${corBadge}" style="cursor:pointer" onclick="alterarEstado(${user.id_user})">${textoBadge} <i class="fas fa-sync-alt ms-1 small"></i></span>`
            : `<span class="badge bg-${corBadge}">${textoBadge}</span>`;

        const linha = `
            <tr>
                <td>#${user.id_user}</td>
                <td class="fw-bold">${user.nome_completo}</td>
                <td>${user.email}</td>
                <td><span class="badge bg-info text-dark">${roleNome}</span></td>
                <td class="text-center">${loginIcon}</td>
                <td>${estadoHTML}</td>
                <td>${accoesHTML}</td>
            </tr>`;
        tabela.innerHTML += linha;
    });
}

function filtrarUtilizadores() {
    const texto = document.getElementById('pesquisaUser').value.toLowerCase();
    
    const usersFiltrados = todosUtilizadores.filter(user => {
        const nome = user.nome_completo ? user.nome_completo.toLowerCase() : '';
        const email = user.email ? user.email.toLowerCase() : '';
        return nome.includes(texto) || email.includes(texto);
    });

    desenharTabelaUsers(usersFiltrados);
}

function abrirModalUser(id, nome, email, roleId) {
    document.getElementById('editId').value = id;
    document.getElementById('editNome').value = nome;
    document.getElementById('editEmail').value = email;
    document.getElementById('editRole').value = roleId;
    new bootstrap.Modal(document.getElementById('modalEditarUser')).show();
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
            alert('Guardado!');
            bootstrap.Modal.getInstance(document.getElementById('modalEditarUser')).hide();
            preencherTabelaUtilizadores();
        } else {
            alert('Erro ao guardar.');
        }
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
    } catch (e) { alert('Erro na ligação'); }
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
    } catch (e) { alert('Erro ao eliminar'); }
}

// ==========================================
// 7. LÓGICA DE CURSOS
// ==========================================

async function preencherTabelaCursos() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/cursos`, { headers: { 'Authorization': 'Bearer ' + token } });
        if(!res.ok) throw new Error("Erro API");

        todosCursos = await res.json();
        desenharTabelaCursos(todosCursos);

    } catch (e) { 
        const tabela = document.getElementById('tabelaCursos');
        if(tabela) tabela.innerHTML = '<tr><td colspan="6" class="text-danger text-center">Erro ao carregar cursos.</td></tr>'; 
    }
}

function desenharTabelaCursos(listaCursos) {
    const tabela = document.getElementById('tabelaCursos');
    if (!tabela) return;

    tabela.innerHTML = '';

    if (listaCursos.length === 0) {
        tabela.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Nenhum curso encontrado.</td></tr>';
        return;
    }

    listaCursos.forEach(curso => {
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
            </tr>`;
        tabela.innerHTML += linha;
    });
}

function filtrarCursos() {
    const texto = document.getElementById('pesquisaCurso').value.toLowerCase();

    const cursosFiltrados = todosCursos.filter(curso => {
        const nome = curso.nome ? curso.nome.toLowerCase() : '';
        const area = curso.area ? curso.area.toLowerCase() : '';
        return nome.includes(texto) || area.includes(texto);
    });

    desenharTabelaCursos(cursosFiltrados);
}

function abrirModalCurso(id = null, nome = '', area = 'TPSI', inicio = '', fim = '') {
    document.getElementById('cursoId').value = id || '';
    document.getElementById('cursoNome').value = nome;
    document.getElementById('cursoArea').value = area;
    if(inicio) document.getElementById('cursoInicio').value = inicio.split('T')[0];
    if(fim) document.getElementById('cursoFim').value = fim.split('T')[0];
    document.getElementById('tituloModalCurso').innerText = id ? 'Editar Curso' : 'Novo Curso';
    new bootstrap.Modal(document.getElementById('modalCurso')).show();
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
            alert('Curso guardado!');
            bootstrap.Modal.getInstance(document.getElementById('modalCurso')).hide();
            preencherTabelaCursos();
        } else alert('Erro ao guardar.');
    } catch (e) { console.error(e); }
}

async function eliminarCurso(id) {
    if(!confirm("Eliminar curso?")) return;
    const token = localStorage.getItem('token');
    try {
        await fetch(`${API_URL}/cursos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        preencherTabelaCursos();
    } catch (e) { alert('Erro ao eliminar'); }
}

// ==========================================
// 8. LÓGICA DE MÓDULOS (NOVO)
// ==========================================

// 1. Preencher o Dropdown com Cursos
async function preencherSelectCursos() {
    const token = localStorage.getItem('token');
    const select = document.getElementById('filtroCursoModulo');
    
    try {
        const res = await fetch(`${API_URL}/cursos`, { headers: { 'Authorization': 'Bearer ' + token } });
        const cursos = await res.json();
        
        // Limpar opções antigas
        select.innerHTML = '<option value="">-- Escolhe um curso --</option>';

        cursos.forEach(c => {
            const option = document.createElement('option');
            option.value = c.id_curso;
            option.text = `${c.nome} (${c.area})`;
            select.appendChild(option);
        });
    } catch (e) { console.error("Erro ao carregar cursos para select"); }
}

// 2. Carregar Módulos quando muda o Select
async function carregarModulosDoCurso() {
    const cursoId = document.getElementById('filtroCursoModulo').value;
    const btnNovo = document.getElementById('btnNovoModulo');
    const tabela = document.getElementById('tabelaModulos');
    const token = localStorage.getItem('token');

    // Se não escolheu nada
    if (!cursoId) {
        btnNovo.disabled = true;
        tabela.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Seleciona um curso acima.</td></tr>';
        return;
    }

    // Ativa o botão de criar
    btnNovo.disabled = false;

    try {
        // Pedir à API apenas os módulos deste curso
        const res = await fetch(`${API_URL}/modulos?cursoId=${cursoId}`, { 
            headers: { 'Authorization': 'Bearer ' + token } 
        });
        const modulos = await res.json();

        tabela.innerHTML = '';
        if (modulos.length === 0) {
            tabela.innerHTML = '<tr><td colspan="4" class="text-center">Este curso ainda não tem módulos.</td></tr>';
            return;
        }

        modulos.forEach(m => {
            const linha = `
                <tr>
                    <td>#${m.id_modulo}</td>
                    <td class="fw-bold">${m.nome}</td>
                    <td>${m.descricao || '-'}</td>
                    <td class="text-end">
                        <button class="btn btn-sm btn-outline-warning" onclick="abrirModalModulo(${m.id_modulo}, '${m.nome}', '${m.descricao || ''}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="eliminarModulo(${m.id_modulo})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
            tabela.innerHTML += linha;
        });

    } catch (error) {
        console.error(error);
        tabela.innerHTML = '<tr><td colspan="4" class="text-danger text-center">Erro ao carregar módulos.</td></tr>';
    }
}

// 3. Abrir Modal (Criar ou Editar Módulo)
function abrirModalModulo(id = null, nome = '', descricao = '') {
    const cursoId = document.getElementById('filtroCursoModulo').value; // Vai buscar o ID do curso selecionado
    
    document.getElementById('moduloId').value = id || '';
    document.getElementById('moduloCursoId').value = cursoId; // IMPORTANTE: associa ao curso
    document.getElementById('moduloNome').value = nome;
    document.getElementById('moduloDescricao').value = descricao;
    
    document.getElementById('tituloModalModulo').innerText = id ? 'Editar Módulo' : 'Novo Módulo';
    new bootstrap.Modal(document.getElementById('modalModulo')).show();
}

// 4. Guardar Módulo (POST ou PUT)
async function guardarModulo() {
    const id = document.getElementById('moduloId').value;
    const cursoId = document.getElementById('moduloCursoId').value;
    const nome = document.getElementById('moduloNome').value;
    const descricao = document.getElementById('moduloDescricao').value;
    const token = localStorage.getItem('token');

    const metodo = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/modulos/${id}` : `${API_URL}/modulos`;

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ nome, descricao, cursoId })
        });

        if (res.ok) {
            alert('Módulo guardado!');
            bootstrap.Modal.getInstance(document.getElementById('modalModulo')).hide();
            carregarModulosDoCurso(); // Atualiza a lista
        } else {
            alert('Erro ao guardar módulo.');
        }
    } catch (e) { console.error(e); }
}

// 5. Eliminar Módulo
async function eliminarModulo(id) {
    if(!confirm("Eliminar este módulo?")) return;
    const token = localStorage.getItem('token');
    try {
        await fetch(`${API_URL}/modulos/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        carregarModulosDoCurso();
    } catch (e) { alert('Erro ao eliminar'); }
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}