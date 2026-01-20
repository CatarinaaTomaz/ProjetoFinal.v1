const API_URL = 'http://localhost:3000/api';

// VARIÁVEIS GLOBAIS
let todosUtilizadores = [];
let todosCursos = [];
let todosModulos = [];
let todasSalas = [];

document.addEventListener("DOMContentLoaded", async () => {
    // 1. LOGIN SOCIAL
    const params = new URLSearchParams(window.location.search);
    const tokenUrl = params.get('token');
    const userUrl = params.get('user');

    if (tokenUrl && userUrl) {
        try {
            const userStringDecoded = decodeURIComponent(userUrl);
            localStorage.setItem('token', tokenUrl);
            localStorage.setItem('user', userStringDecoded);
            window.history.replaceState({}, document.title, "dashboard.html");
        } catch (error) { console.error("Erro login social:", error); }
    }

    // 2. SEGURANÇA
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (!token || !userStr) { window.location.href = 'login.html'; return; }

    let user;
    try { user = JSON.parse(userStr); } catch (e) { logout(); return; }

    const rolesPermitidas = ['Admin', 'Secretaria'];
    if (!rolesPermitidas.includes(user.role)) {
        if (user.role === 'Formador') window.location.href = 'portal-formador.html';
        else window.location.href = 'portal-aluno.html';
        return; 
    }

    // 3. UI INICIAL
    const topoNome = document.getElementById('topo-nome-user');
    if(topoNome) topoNome.innerHTML = `${user.nome || user.nome_completo} <small class="text-white-50">(${user.role})</small>`;
    const toggleButton = document.getElementById("menu-toggle");
    if(toggleButton) toggleButton.onclick = () => document.getElementById("wrapper").classList.toggle("toggled");

    carregarConteudo('inicio');
});

// ==========================================
// ROUTER
// ==========================================
async function carregarConteudo(tipo) {
    const conteudo = document.getElementById('conteudo-principal');
    const titulo = document.getElementById('titulo-seccao');

    // --- INICIO ---
    if (tipo === 'inicio') {
        titulo.innerText = 'Visão Geral';
        conteudo.innerHTML = `
            <div class="row g-3">
                <div class="col-md-3"><div class="p-3 bg-white shadow-sm d-flex justify-content-around align-items-center rounded border-start border-4 border-primary"><div><h3 class="fs-2" id="total-cursos">...</h3><p class="fs-5 text-muted">Cursos</p></div><i class="fas fa-book fs-1 text-primary"></i></div></div>
                <div class="col-md-3"><div class="p-3 bg-white shadow-sm d-flex justify-content-around align-items-center rounded border-start border-4 border-warning"><div><h3 class="fs-2" id="total-users">...</h3><p class="fs-5 text-muted">Users</p></div><i class="fas fa-users fs-1 text-warning"></i></div></div>
                <div class="col-md-3"><div class="p-3 bg-white shadow-sm d-flex justify-content-around align-items-center rounded border-start border-4 border-info"><div><h3 class="fs-2" id="total-salas">...</h3><p class="fs-5 text-muted">Salas</p></div><i class="fas fa-door-open fs-1 text-info"></i></div></div>
                <div class="col-md-3"><div class="p-3 bg-white shadow-sm d-flex justify-content-around align-items-center rounded border-start border-4 border-danger"><div><h3 class="fs-2" id="total-modulos">...</h3><p class="fs-5 text-muted">Módulos</p></div><i class="fas fa-cubes fs-1 text-danger"></i></div></div>
            </div>`;
        atualizarEstatisticas();
    } 
    
    // --- UTILIZADORES ---
    else if (tipo === 'utilizadores') {
        titulo.innerText = 'Gestão de Utilizadores';
        conteudo.innerHTML = `
            <div class="row mb-3"><div class="col-md-6"><div class="input-group shadow-sm"><span class="input-group-text bg-white border-end-0"><i class="fas fa-search text-muted"></i></span><input type="text" class="form-control border-start-0" id="pesquisaUser" placeholder="Pesquisar..." onkeyup="filtrarUtilizadores()"></div></div></div>
            <div class="card shadow-sm border-0"><div class="card-body"><div class="table-responsive"><table class="table table-hover align-middle"><thead class="table-dark"><tr><th>ID</th><th>Nome</th><th>Email</th><th>Role</th><th>Origem</th><th>Estado</th><th>Ações</th></tr></thead><tbody id="tabelaUsers"><tr><td colspan="7" class="text-center">A carregar...</td></tr></tbody></table></div></div></div>`;
        await preencherTabelaUtilizadores();
    }

    // --- CURSOS (ALTERADO) ---
    else if (tipo === 'cursos') {
        titulo.innerText = 'Gestão de Cursos';
        conteudo.innerHTML = `
            <div id="alerta-proximos-cursos" class="mb-4" style="display: none;">
                <div class="card border-warning shadow-sm">
                    <div class="card-header bg-warning text-dark fw-bold">
                        <i class="fas fa-hourglass-half me-2"></i>Arrancam nos próximos 60 dias
                    </div>
                    <div class="card-body bg-light">
                        <ul id="lista-proximos-cursos" class="list-group list-group-flush bg-transparent"></ul>
                    </div>
                </div>
            </div>

            <div class="d-flex justify-content-between align-items-center mb-3">
                <button class="btn btn-success shadow-sm" onclick="abrirModalCurso()"><i class="fas fa-plus me-2"></i>Novo Curso</button>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <div class="input-group shadow-sm">
                        <span class="input-group-text bg-white border-end-0"><i class="fas fa-search text-muted"></i></span>
                        <input type="text" class="form-control border-start-0" id="pesquisaCurso" placeholder="Pesquisar curso..." onkeyup="filtrarCursos()">
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
                                    <th>Estado</th> <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody id="tabelaCursos">
                                <tr><td colspan="7" class="text-center">A carregar...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        await preencherTabelaCursos();
    }

    // --- MÓDULOS ---
    else if (tipo === 'modulos') {
        titulo.innerText = 'Gestão de Módulos';
        conteudo.innerHTML = `
            <div class="alert alert-info border-start border-4 border-info"><i class="fas fa-info-circle me-2"></i>Primeiro seleciona um curso.</div>
            <div class="row mb-4">
                <div class="col-md-6"><label class="form-label fw-bold">Selecionar Curso:</label><select class="form-select shadow-sm" id="filtroCursoModulo" onchange="carregarModulosDoCurso()"><option value="">-- Escolhe um curso --</option></select></div>
                <div class="col-md-6 d-flex align-items-end"><button class="btn btn-warning text-dark w-100 shadow-sm" id="btnNovoModulo" onclick="abrirModalModulo()" disabled><i class="fas fa-plus me-2"></i>Adicionar Módulo</button></div>
            </div>
            <div class="card shadow-sm border-0"><div class="card-body"><h5 class="card-title mb-3 text-secondary">Lista de Módulos</h5><div class="table-responsive"><table class="table table-hover align-middle"><thead class="table-light"><tr><th>ID</th><th>Nome do Módulo</th><th>Descrição</th><th class="text-end">Ações</th></tr></thead><tbody id="tabelaModulos"><tr><td colspan="4" class="text-center text-muted">Seleciona um curso acima.</td></tr></tbody></table></div></div></div>`;
        await preencherSelectCursos();
    }

    // --- SALAS ---
    else if (tipo === 'salas') {
        titulo.innerText = 'Gestão de Salas';
        conteudo.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3"><button class="btn btn-info shadow-sm" onclick="abrirModalSala()"><i class="fas fa-plus me-2"></i>Nova Sala</button></div>
            <div class="row mb-3"><div class="col-md-6"><div class="input-group shadow-sm"><span class="input-group-text bg-white border-end-0"><i class="fas fa-search text-muted"></i></span><input type="text" class="form-control border-start-0" id="pesquisaSala" placeholder="Pesquisar..." onkeyup="filtrarSalas()"></div></div></div>
            <div class="card shadow-sm border-0"><div class="card-body"><div class="table-responsive"><table class="table table-hover align-middle"><thead class="table-dark"><tr><th>ID</th><th>Nome</th><th>Tipo</th><th>Capacidade</th><th>Ações</th></tr></thead><tbody id="tabelaSalas"><tr><td colspan="5" class="text-center">A carregar...</td></tr></tbody></table></div></div></div>`;
        await preencherTabelaSalas();
    }
}

// ==========================================
// ESTATÍSTICAS
// ==========================================
async function atualizarEstatisticas() {
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': 'Bearer ' + token };
    try {
        fetch(`${API_URL}/cursos`, { headers }).then(r=>r.json()).then(d=> document.getElementById('total-cursos')?document.getElementById('total-cursos').innerText=d.length:null);
        fetch(`${API_URL}/users`, { headers }).then(r=>r.json()).then(d=> document.getElementById('total-users')?document.getElementById('total-users').innerText=d.length:null);
        fetch(`${API_URL}/salas`, { headers }).then(r=>r.json()).then(d=> document.getElementById('total-salas')?document.getElementById('total-salas').innerText=d.length:null);
        fetch(`${API_URL}/modulos`, { headers }).then(r=>r.json()).then(d=> document.getElementById('total-modulos')?document.getElementById('total-modulos').innerText=d.length:null);
    } catch (e) {}
}

// ==========================================
// LÓGICA DE CURSOS (ATUALIZADA) 🧠
// ==========================================

async function preencherTabelaCursos() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/cursos`, { headers: { 'Authorization': 'Bearer ' + token } });
        if(!res.ok) throw new Error("Erro API");

        todosCursos = await res.json();
        
        // 1. Verificar Arranques nos próximos 60 dias
        verificarArranquesProximos(todosCursos);

        // 2. Desenhar Tabela
        desenharTabelaCursos(todosCursos);

    } catch (e) { 
        const tabela = document.getElementById('tabelaCursos');
        if(tabela) tabela.innerHTML = '<tr><td colspan="7" class="text-danger text-center">Erro ao carregar cursos.</td></tr>'; 
    }
}

function verificarArranquesProximos(cursos) {
    const container = document.getElementById('alerta-proximos-cursos');
    const lista = document.getElementById('lista-proximos-cursos');
    
    const hoje = new Date();
    hoje.setHours(0,0,0,0);

    let temProximos = false;
    if(lista) lista.innerHTML = '';

    cursos.forEach(curso => {
        // REMOVIDO: if (!curso.status) return; 
        // Agora verifica TODOS os cursos, ativos ou inativos

        const dataInicio = new Date(curso.data_inicio);
        dataInicio.setHours(0,0,0,0);
        
        const diffTime = dataInicio - hoje;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= 60) {
            temProximos = true;
            const li = document.createElement('li');
            li.className = "list-group-item d-flex justify-content-between align-items-center bg-transparent";
            
            let badgeText = diffDays === 0 ? "Começa Hoje!" : `Faltam ${diffDays} dias`;
            // Se estiver inativo, mostramos uma cor diferente para avisar
            let badgeColor = diffDays < 15 ? "danger" : "warning text-dark";
            let statusIcon = curso.status ? '<i class="fas fa-check-circle text-success" title="Ativo"></i>' : '<i class="fas fa-stop-circle text-danger" title="Inativo"></i>';

            li.innerHTML = `
                <span>
                    ${statusIcon} 
                    <strong>${curso.nome}</strong> (${curso.area}) - ${dataInicio.toLocaleDateString('pt-PT')}
                </span>
                <span class="badge bg-${badgeColor}">${badgeText}</span>
            `;
            if(lista) lista.appendChild(li);
        }
    });

    if(container) container.style.display = temProximos ? 'block' : 'none';
}

function desenharTabelaCursos(listaCursos) {
    const tabela = document.getElementById('tabelaCursos');
    if (!tabela) return;
    tabela.innerHTML = '';

    if (listaCursos.length === 0) {
        tabela.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Nenhum curso encontrado.</td></tr>';
        return;
    }

    listaCursos.forEach(curso => {
        const inicio = new Date(curso.data_inicio).toLocaleDateString('pt-PT');
        const fim = new Date(curso.data_fim).toLocaleDateString('pt-PT');
        
        // Badge de Estado
        const statusBadge = curso.status 
            ? '<span class="badge bg-success"><i class="fas fa-check-circle me-1"></i>A decorrer</span>' 
            : '<span class="badge bg-secondary"><i class="fas fa-stop-circle me-1"></i>Inativo</span>';

        const linha = `
            <tr>
                <td>#${curso.id_curso}</td>
                <td class="fw-bold">${curso.nome}</td>
                <td><span class="badge bg-secondary">${curso.area}</span></td>
                <td>${inicio}</td>
                <td>${fim}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-sm btn-warning text-white" 
                        onclick="abrirModalCurso(${curso.id_curso}, '${curso.nome}', '${curso.area}', '${curso.data_inicio}', '${curso.data_fim}', ${curso.status})">
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
    const filtrados = todosCursos.filter(c => c.nome.toLowerCase().includes(texto) || c.area.toLowerCase().includes(texto));
    desenharTabelaCursos(filtrados);
}

// Modal Cursos (Atualizado com Checkbox de Status)
function abrirModalCurso(id = null, nome = '', area = 'TPSI', inicio = '', fim = '', status = false) {
    document.getElementById('cursoId').value = id || '';
    document.getElementById('cursoNome').value = nome;
    document.getElementById('cursoArea').value = area;
    
    if(inicio) document.getElementById('cursoInicio').value = inicio.split('T')[0];
    else document.getElementById('cursoInicio').value = '';

    if(fim) document.getElementById('cursoFim').value = fim.split('T')[0];
    else document.getElementById('cursoFim').value = '';
    
    // Configurar o Switch
    const checkStatus = document.getElementById('cursoStatus');
    if (checkStatus) {
        checkStatus.checked = status; // Agora começa desligado (false) se for novo
        
        // Se quiseres mostrar o botão mesmo ao criar novo, comenta a linha abaixo.
        // Se quiseres manter escondido ao criar (e ele fica inativo 'às escuras'), mantém assim:
        document.getElementById('divStatusCurso').style.display = id ? 'block' : 'none';
    }

    document.getElementById('tituloModalCurso').innerText = id ? 'Editar Curso' : 'Novo Curso';
    new bootstrap.Modal(document.getElementById('modalCurso')).show();
}

async function guardarCurso() {
    const id = document.getElementById('cursoId').value;
    const nome = document.getElementById('cursoNome').value;
    const area = document.getElementById('cursoArea').value;
    const data_inicio = document.getElementById('cursoInicio').value;
    const data_fim = document.getElementById('cursoFim').value;
    
    // LER O CHECKBOX (true ou false)
    const checkElement = document.getElementById('cursoStatus');
    // Se o elemento existir, lê o checked. Se não existir (novo curso), assume true.
    const status = checkElement ? checkElement.checked : true;

    const token = localStorage.getItem('token');
    const metodo = id ? 'PUT' : 'POST'; 
    const url = id ? `${API_URL}/cursos/${id}` : `${API_URL}/cursos`;
    
    // Construir o objeto com STATUS incluído
    const bodyData = { 
        nome, 
        area, 
        data_inicio, 
        data_fim,
        status: status 
    };

    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify(bodyData)
        });
        
        if (res.ok) {
            // Sucesso!
            const modalEl = document.getElementById('modalCurso');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();
            
            alert('Curso guardado com sucesso!');
            preencherTabelaCursos(); // Recarrega a tabela e os alertas
        } else {
            const err = await res.json();
            alert('Erro: ' + (err.msg || 'Erro desconhecido'));
        }
    } catch (e) { 
        console.error(e); 
        alert('Erro de conexão com o servidor.');
    }
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
// FUNÇÕES AUXILIARES (Users, Salas, Módulos - Mantêm-se)
// ==========================================
// USERS
async function preencherTabelaUtilizadores(){const t=localStorage.getItem('token');const r=await fetch(`${API_URL}/users`,{headers:{'Authorization':'Bearer '+t}});todosUtilizadores=await r.json();desenharTabelaUsers(todosUtilizadores);}
function desenharTabelaUsers(l){const t=document.getElementById('tabelaUsers');const u=JSON.parse(localStorage.getItem('user'));const ia=u.role==='Admin';if(!t)return;t.innerHTML='';if(l.length===0){t.innerHTML='<tr><td colspan="7">Nada.</td></tr>';return;}l.forEach(x=>{let a=ia?`<button class="btn btn-sm btn-warning text-white" onclick="abrirModalUser(${x.id_user},'${x.nome_completo}','${x.email}',${x.Role?x.Role.id_role:2})"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-danger" onclick="eliminarUser(${x.id_user})"><i class="fas fa-trash"></i></button>`:`<i class="fas fa-lock text-muted"></i>`;t.innerHTML+=`<tr><td>#${x.id_user}</td><td class="fw-bold">${x.nome_completo}</td><td>${x.email}</td><td><span class="badge bg-info text-dark">${x.Role?x.Role.descricao:'-'}</span></td><td class="text-center">${x.googleId?'<i class="fab fa-google text-danger"></i>':'<i class="fas fa-envelope text-secondary"></i>'}</td><td><span class="badge bg-${x.conta_ativa?'success':'danger'}">${x.conta_ativa?'Ativo':'Inativo'}</span></td><td>${a}</td></tr>`;});}
function filtrarUtilizadores(){const v=document.getElementById('pesquisaUser').value.toLowerCase();desenharTabelaUsers(todosUtilizadores.filter(u=>u.nome_completo.toLowerCase().includes(v)||u.email.toLowerCase().includes(v)));}
function abrirModalUser(id,n,e,r){document.getElementById('editId').value=id;document.getElementById('editNome').value=n;document.getElementById('editEmail').value=e;document.getElementById('editRole').value=r;new bootstrap.Modal(document.getElementById('modalEditarUser')).show();}
async function guardarEdicaoUser(){const id=document.getElementById('editId').value;const n=document.getElementById('editNome').value;const e=document.getElementById('editEmail').value;const r=document.getElementById('editRole').value;const t=localStorage.getItem('token');await fetch(`${API_URL}/users/${id}`,{method:'PUT',headers:{'Content-Type':'application/json','Authorization':'Bearer '+t},body:JSON.stringify({nome:n,email:e,roleId:r})}).then(()=>{alert('Guardado');bootstrap.Modal.getInstance(document.getElementById('modalEditarUser')).hide();preencherTabelaUtilizadores();});}
async function eliminarUser(id){if(confirm("Apagar?")){const t=localStorage.getItem('token');await fetch(`${API_URL}/users/${id}`,{method:'DELETE',headers:{'Authorization':'Bearer '+t}}).then(preencherTabelaUtilizadores);}}

// SALAS
async function preencherTabelaSalas(){const t=localStorage.getItem('token');const r=await fetch(`${API_URL}/salas`,{headers:{'Authorization':'Bearer '+t}});todasSalas=await r.json();desenharTabelaSalas(todasSalas);}
function desenharTabelaSalas(l){const t=document.getElementById('tabelaSalas');if(!t)return;t.innerHTML='';if(l.length===0){t.innerHTML='<tr><td colspan="5">Nada.</td></tr>';return;}l.forEach(s=>{t.innerHTML+=`<tr><td>#${s.id_sala}</td><td class="fw-bold">${s.nome}</td><td><span class="badge bg-secondary">${s.tipo}</span></td><td>${s.capacidade} pax</td><td><button class="btn btn-sm btn-warning text-white" onclick="abrirModalSala(${s.id_sala},'${s.nome}','${s.tipo}',${s.capacidade})"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-danger" onclick="eliminarSala(${s.id_sala})"><i class="fas fa-trash"></i></button></td></tr>`;});}
function filtrarSalas(){const v=document.getElementById('pesquisaSala').value.toLowerCase();desenharTabelaSalas(todasSalas.filter(s=>s.nome.toLowerCase().includes(v)));}
function abrirModalSala(id=null,n='',tp='Teórica',c=''){document.getElementById('salaId').value=id||'';document.getElementById('salaNome').value=n;document.getElementById('salaTipo').value=tp;document.getElementById('salaCapacidade').value=c;document.getElementById('tituloModalSala').innerText=id?'Editar':'Nova';new bootstrap.Modal(document.getElementById('modalSala')).show();}
async function guardarSala(){const id=document.getElementById('salaId').value;const n=document.getElementById('salaNome').value;const tp=document.getElementById('salaTipo').value;const c=document.getElementById('salaCapacidade').value;const t=localStorage.getItem('token');const m=id?'PUT':'POST';const u=id?`${API_URL}/salas/${id}`:`${API_URL}/salas`;await fetch(u,{method:m,headers:{'Content-Type':'application/json','Authorization':'Bearer '+t},body:JSON.stringify({nome:n,tipo:tp,capacidade:c})}).then(()=>{alert('Guardado');bootstrap.Modal.getInstance(document.getElementById('modalSala')).hide();preencherTabelaSalas();});}
async function eliminarSala(id){if(confirm("Apagar?")){const t=localStorage.getItem('token');await fetch(`${API_URL}/salas/${id}`,{method:'DELETE',headers:{'Authorization':'Bearer '+t}}).then(preencherTabelaSalas);}}

// MODULOS
async function preencherSelectCursos(){const t=localStorage.getItem('token');const r=await fetch(`${API_URL}/cursos`,{headers:{'Authorization':'Bearer '+t}});const c=await r.json();const s=document.getElementById('filtroCursoModulo');s.innerHTML='<option value="">-- Escolhe --</option>';c.forEach(x=>{const o=document.createElement('option');o.value=x.id_curso;o.text=x.nome;s.appendChild(o);});}
async function carregarModulosDoCurso(){const id=document.getElementById('filtroCursoModulo').value;const b=document.getElementById('btnNovoModulo');const t=document.getElementById('tabelaModulos');if(!id){b.disabled=true;t.innerHTML='<tr><td colspan="4">Escolhe curso.</td></tr>';return;}b.disabled=false;const tk=localStorage.getItem('token');const r=await fetch(`${API_URL}/modulos?cursoId=${id}`,{headers:{'Authorization':'Bearer '+tk}});const m=await r.json();t.innerHTML='';if(m.length===0){t.innerHTML='<tr><td colspan="4">Sem módulos.</td></tr>';return;}m.forEach(x=>{t.innerHTML+=`<tr><td>#${x.id_modulo}</td><td class="fw-bold">${x.nome}</td><td>${x.descricao||'-'}</td><td class="text-end"><button class="btn btn-sm btn-outline-warning" onclick="abrirModalModulo(${x.id_modulo},'${x.nome}','${x.descricao}')"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-outline-danger" onclick="eliminarModulo(${x.id_modulo})"><i class="fas fa-trash"></i></button></td></tr>`;});}
function abrirModalModulo(id=null,n='',d=''){const cid=document.getElementById('filtroCursoModulo').value;document.getElementById('moduloId').value=id||'';document.getElementById('moduloCursoId').value=cid;document.getElementById('moduloNome').value=n;document.getElementById('moduloDescricao').value=d;document.getElementById('tituloModalModulo').innerText=id?'Editar':'Novo';new bootstrap.Modal(document.getElementById('modalModulo')).show();}
async function guardarModulo(){const id=document.getElementById('moduloId').value;const n=document.getElementById('moduloNome').value;const d=document.getElementById('moduloDescricao').value;const c=document.getElementById('moduloCursoId').value;const t=localStorage.getItem('token');const m=id?'PUT':'POST';const u=id?`${API_URL}/modulos/${id}`:`${API_URL}/modulos`;await fetch(u,{method:m,headers:{'Content-Type':'application/json','Authorization':'Bearer '+t},body:JSON.stringify({nome:n,descricao:d,cursoId:c})}).then(()=>{alert('Guardado');bootstrap.Modal.getInstance(document.getElementById('modalModulo')).hide();carregarModulosDoCurso();});}
async function eliminarModulo(id){if(confirm("Apagar?")){const t=localStorage.getItem('token');await fetch(`${API_URL}/modulos/${id}`,{method:'DELETE',headers:{'Authorization':'Bearer '+t}}).then(carregarModulosDoCurso);}}

function logout(){localStorage.clear();window.location.href='login.html';}