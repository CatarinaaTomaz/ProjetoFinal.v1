const API_URL = 'http://localhost:3000/api';

// ==========================================
// VARIÁVEIS GLOBAIS
// ==========================================
let todosUtilizadores = [];
let todosCursos = [];
let todosModulos = [];
let todasSalas = [];

console.log("🚀 Dashboard.js carregado com sucesso!");

document.addEventListener("DOMContentLoaded", async () => {
    
    // 1. PROCESSAR LOGIN SOCIAL
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
        console.warn("Acesso negado.");
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

    // --- INICIO (ESTATÍSTICAS) ---
    if (tipo === 'inicio') {
        titulo.innerText = 'Estatísticas Gerais';
        conteudo.innerHTML = `
            <div class="row g-3 mb-4">
                <div class="col-md-4">
                    <div class="p-3 bg-white shadow-sm border-start border-4 border-success rounded">
                        <h3 class="fs-2" id="stat-decorrer">...</h3>
                        <p class="text-muted mb-0">Cursos a Decorrer</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="p-3 bg-white shadow-sm border-start border-4 border-secondary rounded">
                        <h3 class="fs-2" id="stat-terminados">...</h3>
                        <p class="text-muted mb-0">Cursos Terminados</p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="p-3 bg-white shadow-sm border-start border-4 border-primary rounded">
                        <h3 class="fs-2" id="stat-formandos">...</h3>
                        <p class="text-muted mb-0">Formandos Ativos</p>
                    </div>
                </div>
            </div>

            <div class="row g-3">
                <div class="col-md-6">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-header bg-white fw-bold">Cursos por Área</div>
                        <div class="card-body">
                            <ul class="list-group list-group-flush" id="lista-areas">
                                <li class="list-group-item">A carregar...</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="col-md-6">
                    <div class="card shadow-sm border-0 h-100">
                        <div class="card-header bg-warning text-dark fw-bold">
                            <i class="fas fa-trophy me-2"></i>Top 10 Formadores (Horas)
                        </div>
                        <div class="card-body p-0">
                            <table class="table table-striped mb-0">
                                <thead><tr><th>Nome</th><th class="text-end">Horas</th></tr></thead>
                                <tbody id="tabela-top-formadores">
                                    <tr><td colspan="2" class="text-center p-3">A carregar...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
        atualizarEstatisticasCompletas();
    }
    
    // --- UTILIZADORES ---
    else if (tipo === 'utilizadores') {
        titulo.innerText = 'Gestão de Utilizadores';
        conteudo.innerHTML = `
            <div class="row mb-3"><div class="col-md-6"><div class="input-group shadow-sm"><span class="input-group-text bg-white border-end-0"><i class="fas fa-search text-muted"></i></span><input type="text" class="form-control border-start-0" id="pesquisaUser" placeholder="Pesquisar..." onkeyup="filtrarUtilizadores()"></div></div></div>
            <div class="card shadow-sm border-0"><div class="card-body"><div class="table-responsive"><table class="table table-hover align-middle"><thead class="table-dark"><tr><th>ID</th><th>Nome</th><th>Email</th><th>Role</th><th>Origem</th><th>Estado</th><th>Ações</th></tr></thead><tbody id="tabelaUsers"><tr><td colspan="7" class="text-center">A carregar...</td></tr></tbody></table></div></div></div>`;
        await preencherTabelaUtilizadores();
    }

    // --- CURSOS ---
    else if (tipo === 'cursos') {
        titulo.innerText = 'Gestão de Cursos';
        conteudo.innerHTML = `
            <div id="alerta-proximos-cursos" class="mb-4" style="display: none;">
                <div class="card border-warning shadow-sm"><div class="card-header bg-warning text-dark fw-bold"><i class="fas fa-hourglass-half me-2"></i>Arranques Próximos (60 dias)</div><div class="card-body bg-light"><ul id="lista-proximos-cursos" class="list-group list-group-flush bg-transparent"></ul></div></div>
            </div>
            <div class="d-flex justify-content-between align-items-center mb-3"><button class="btn btn-success shadow-sm" onclick="abrirModalCurso()"><i class="fas fa-plus me-2"></i>Novo Curso</button></div>
            <div class="row mb-3"><div class="col-md-6"><div class="input-group shadow-sm"><span class="input-group-text bg-white border-end-0"><i class="fas fa-search text-muted"></i></span><input type="text" class="form-control border-start-0" id="pesquisaCurso" placeholder="Pesquisar..." onkeyup="filtrarCursos()"></div></div></div>
            <div class="card shadow-sm border-0"><div class="card-body"><div class="table-responsive"><table class="table table-hover align-middle"><thead class="table-dark"><tr><th>ID</th><th>Nome</th><th>Área</th><th>Início</th><th>Fim</th><th>Estado</th><th>Ações</th></tr></thead><tbody id="tabelaCursos"><tr><td colspan="7" class="text-center">A carregar...</td></tr></tbody></table></div></div></div>`;
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
            <div class="card shadow-sm border-0"><div class="card-body"><h5 class="card-title mb-3 text-secondary">Lista de Módulos</h5><div class="table-responsive"><table class="table table-hover align-middle"><thead class="table-light"><tr><th>ID</th><th>Nome do Módulo</th><th>Info</th><th>Descrição</th><th class="text-end">Ações</th></tr></thead><tbody id="tabelaModulos"><tr><td colspan="5" class="text-center text-muted">Seleciona um curso acima.</td></tr></tbody></table></div></div></div>`;
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
async function atualizarEstatisticasCompletas() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/stats`, { headers: { 'Authorization': 'Bearer ' + token } });
        const data = await res.json();

        // Totais
        document.getElementById('stat-decorrer').innerText = data.cursosDecorrer;
        document.getElementById('stat-terminados').innerText = data.cursosTerminados;
        document.getElementById('stat-formandos').innerText = data.totalFormandos;

        // Cursos por Área
        const listaAreas = document.getElementById('lista-areas');
        listaAreas.innerHTML = '';
        if (data.cursosPorArea.length === 0) listaAreas.innerHTML = '<li class="list-group-item">Sem cursos.</li>';
        data.cursosPorArea.forEach(item => {
            listaAreas.innerHTML += `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    ${item.area}
                    <span class="badge bg-primary rounded-pill">${item.total}</span>
                </li>`;
        });

        // Top Formadores
        const tabelaTop = document.getElementById('tabela-top-formadores');
        tabelaTop.innerHTML = '';
        if (data.topFormadores.length === 0) tabelaTop.innerHTML = '<tr><td colspan="2" class="text-center p-3">Sem dados de formadores.</td></tr>';
        data.topFormadores.forEach(f => {
            tabelaTop.innerHTML += `
                <tr>
                    <td>${f.nome_completo}</td>
                    <td class="text-end fw-bold">${f.horas_lecionadas} h</td>
                </tr>`;
        });

    } catch (e) { console.error("Erro stats:", e); }
}

// ==========================================
// LÓGICA DE CURSOS E ALERTAS
// ==========================================
async function preencherTabelaCursos() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/cursos`, { headers: { 'Authorization': 'Bearer ' + token } });
        todosCursos = await res.json();
        verificarArranquesProximos(todosCursos);
        desenharTabelaCursos(todosCursos);
    } catch (e) { document.getElementById('tabelaCursos').innerHTML = '<tr><td colspan="7" class="text-danger text-center">Erro.</td></tr>'; }
}

function verificarArranquesProximos(cursos) {
    const container = document.getElementById('alerta-proximos-cursos');
    const lista = document.getElementById('lista-proximos-cursos');
    const hoje = new Date(); hoje.setHours(0,0,0,0);
    let temProximos = false; if(lista) lista.innerHTML = '';

    cursos.forEach(c => {
        const dataInicio = new Date(c.data_inicio); dataInicio.setHours(0,0,0,0);
        const diffDays = Math.ceil((dataInicio - hoje) / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= 60) {
            temProximos = true;
            const statusIcon = c.status ? '<i class="fas fa-check-circle text-success" title="Ativo"></i>' : '<i class="fas fa-stop-circle text-danger" title="Inativo"></i>';
            const badgeColor = diffDays < 15 ? "danger" : "warning text-dark";
            lista.innerHTML += `<li class="list-group-item d-flex justify-content-between bg-transparent"><span>${statusIcon} <strong>${c.nome}</strong> - ${dataInicio.toLocaleDateString()}</span><span class="badge bg-${badgeColor}">Faltam ${diffDays} dias</span></li>`;
        }
    });
    if(container) container.style.display = temProximos ? 'block' : 'none';
}

function desenharTabelaCursos(lista) {
    const t = document.getElementById('tabelaCursos');
    // Obter user atual para verificar permissões
    const u = JSON.parse(localStorage.getItem('user'));
    // Permissão: Admin OU Secretaria
    const podeGerir = ['Admin', 'Secretaria'].includes(u.role);

    if (!t) return;
    t.innerHTML = '';

    if (lista.length === 0) {
        t.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Nenhum curso encontrado.</td></tr>';
        return;
    }

    lista.forEach(c => {
        const inicio = new Date(c.data_inicio).toLocaleDateString('pt-PT');
        const fim = new Date(c.data_fim).toLocaleDateString('pt-PT');
        
        const statusBadge = c.status 
            ? '<span class="badge bg-success"><i class="fas fa-check-circle me-1"></i>A decorrer</span>' 
            : '<span class="badge bg-secondary"><i class="fas fa-stop-circle me-1"></i>Inativo</span>';

        // Botão de Gestão de Alunos (Só aparece se tiver permissão)
        const btnAlunos = podeGerir 
            ? `<button class="btn btn-sm btn-primary me-1" onclick="abrirGestaoAlunos(${c.id_curso}, '${c.nome}')" title="Gerir Alunos"><i class="fas fa-user-graduate"></i></button>`
            : '';

        // Botões de Editar/Apagar (Só Admin/Secretaria)
        const botoesAdmin = podeGerir
            ? `
                <button class="btn btn-sm btn-warning text-white" onclick="abrirModalCurso(${c.id_curso}, '${c.nome}', '${c.area}', '${c.data_inicio}', '${c.data_fim}', ${c.status})"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger" onclick="eliminarCurso(${c.id_curso})"><i class="fas fa-trash"></i></button>
              `
            : '<i class="fas fa-lock text-muted"></i>';

        t.innerHTML += `
            <tr>
                <td>#${c.id_curso}</td>
                <td class="fw-bold">${c.nome}</td>
                <td><span class="badge bg-secondary">${c.area}</span></td>
                <td>${inicio}</td>
                <td>${fim}</td>
                <td>${statusBadge}</td>
                <td>
                    ${btnAlunos}
                    ${botoesAdmin}
                </td>
            </tr>`;
    });
}
function filtrarCursos(){const v=document.getElementById('pesquisaCurso').value.toLowerCase();desenharTabelaCursos(todosCursos.filter(c=>c.nome.toLowerCase().includes(v)));}
function abrirModalCurso(id=null,n='',a='TPSI',i='',f='',s=false){document.getElementById('cursoId').value=id||'';document.getElementById('cursoNome').value=n;document.getElementById('cursoArea').value=a;document.getElementById('cursoInicio').value=i?i.split('T')[0]:'';document.getElementById('cursoFim').value=f?f.split('T')[0]:'';const ck=document.getElementById('cursoStatus');if(ck)ck.checked=s;document.getElementById('divStatusCurso').style.display=id?'block':'none';document.getElementById('tituloModalCurso').innerText=id?'Editar':'Novo';new bootstrap.Modal(document.getElementById('modalCurso')).show();}
async function guardarCurso(){const id=document.getElementById('cursoId').value;const n=document.getElementById('cursoNome').value;const a=document.getElementById('cursoArea').value;const i=document.getElementById('cursoInicio').value;const f=document.getElementById('cursoFim').value;const s=document.getElementById('cursoStatus')?document.getElementById('cursoStatus').checked:false;const t=localStorage.getItem('token');const m=id?'PUT':'POST';const u=id?`${API_URL}/cursos/${id}`:`${API_URL}/cursos`;await fetch(u,{method:m,headers:{'Content-Type':'application/json','Authorization':'Bearer '+t},body:JSON.stringify({nome:n,area:a,data_inicio:i,data_fim:f,status:s})}).then(()=>{alert('Guardado');bootstrap.Modal.getInstance(document.getElementById('modalCurso')).hide();preencherTabelaCursos();});}
async function eliminarCurso(id){if(confirm("Apagar?")){const t=localStorage.getItem('token');await fetch(`${API_URL}/cursos/${id}`,{method:'DELETE',headers:{'Authorization':'Bearer '+t}}).then(preencherTabelaCursos);}}

// ==========================================
// MÓDULOS (COM ASYNC E LOGS)
// ==========================================
async function preencherSelectCursos(){const t=localStorage.getItem('token');const r=await fetch(`${API_URL}/cursos`,{headers:{'Authorization':'Bearer '+t}});const c=await r.json();const s=document.getElementById('filtroCursoModulo');s.innerHTML='<option value="">-- Escolhe --</option>';c.forEach(x=>{const o=document.createElement('option');o.value=x.id_curso;o.text=x.nome;s.appendChild(o);});}

async function carregarModulosDoCurso(){const cid=document.getElementById('filtroCursoModulo').value;const btn=document.getElementById('btnNovoModulo');const t=document.getElementById('tabelaModulos');if(!cid){btn.disabled=true;t.innerHTML='<tr><td colspan="5">Escolhe curso.</td></tr>';return;}btn.disabled=false;const tk=localStorage.getItem('token');const r=await fetch(`${API_URL}/modulos?cursoId=${cid}`,{headers:{'Authorization':'Bearer '+tk}});const m=await r.json();t.innerHTML='';if(m.length===0){t.innerHTML='<tr><td colspan="5">Sem módulos.</td></tr>';return;}
    m.forEach(x=>{
        const nf = x.Formador ? `<i class="fas fa-user-tie"></i> ${x.Formador.nome_completo}` : '-';
        const ns = x.Sala ? `<i class="fas fa-door-open"></i> ${x.Sala.nome}` : '-';
        t.innerHTML+=`<tr><td>#${x.id_modulo}</td><td class="fw-bold">${x.nome}</td><td><small>${nf}<br>${ns}</small></td><td>${x.descricao||'-'}</td><td class="text-end"><button class="btn btn-sm btn-outline-warning" onclick="abrirModalModulo(${x.id_modulo},'${x.nome}','${x.descricao}','${x.formadorId||''}','${x.salaId||''}')"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-outline-danger" onclick="eliminarModulo(${x.id_modulo})"><i class="fas fa-trash"></i></button></td></tr>`;
    });
}

// *** CORREÇÃO PARA LISTAS VAZIAS ***
async function preencherSelectsModalModulo() {
    console.log("🔄 A carregar dados do modal...");
    const selFormador = document.getElementById('moduloFormador');
    const selSala = document.getElementById('moduloSala');
    const token = localStorage.getItem('token');

    try {
        const rU = await fetch(`${API_URL}/users`, { headers: { 'Authorization': 'Bearer ' + token } });
        const users = await rU.json();
        selFormador.innerHTML = '<option value="">-- Sem Formador --</option>';
        users.forEach(u => {
            if (u.Role && u.Role.descricao.toLowerCase().includes('formador')) {
                const opt = document.createElement('option');
                opt.value = u.id_user;
                opt.text = u.nome_completo;
                selFormador.appendChild(opt);
            }
        });

        const rS = await fetch(`${API_URL}/salas`, { headers: { 'Authorization': 'Bearer ' + token } });
        const salas = await rS.json();
        selSala.innerHTML = '<option value="">-- Sem Sala --</option>';
        salas.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s.id_sala;
            opt.text = `${s.nome} (${s.tipo})`;
            selSala.appendChild(opt);
        });

    } catch (e) { console.error("Erro modal:", e); }
}

async function abrirModalModulo(id=null, n='', d='', fId='', sId='') {
    const cursoId = document.getElementById('filtroCursoModulo').value;
    const btn = document.getElementById('btnNovoModulo');
    const txtOrig = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A carregar...';
    await preencherSelectsModalModulo();
    btn.innerHTML = txtOrig;
    document.getElementById('moduloId').value = id||'';
    document.getElementById('moduloCursoId').value = cursoId;
    document.getElementById('moduloNome').value = n;
    document.getElementById('moduloDescricao').value = d;
    document.getElementById('moduloFormador').value = fId;
    document.getElementById('moduloSala').value = sId;
    document.getElementById('tituloModalModulo').innerText = id?'Editar':'Novo';
    new bootstrap.Modal(document.getElementById('modalModulo')).show();
}

async function guardarModulo(){const id=document.getElementById('moduloId').value;const n=document.getElementById('moduloNome').value;const d=document.getElementById('moduloDescricao').value;const c=document.getElementById('moduloCursoId').value;const f=document.getElementById('moduloFormador').value;const s=document.getElementById('moduloSala').value;const t=localStorage.getItem('token');const m=id?'PUT':'POST';const u=id?`${API_URL}/modulos/${id}`:`${API_URL}/modulos`;await fetch(u,{method:m,headers:{'Content-Type':'application/json','Authorization':'Bearer '+t},body:JSON.stringify({nome:n,descricao:d,cursoId:c,formadorId:f,salaId:s})}).then(()=>{alert('Guardado');bootstrap.Modal.getInstance(document.getElementById('modalModulo')).hide();carregarModulosDoCurso();});}
async function eliminarModulo(id){if(confirm("Apagar?")){const t=localStorage.getItem('token');await fetch(`${API_URL}/modulos/${id}`,{method:'DELETE',headers:{'Authorization':'Bearer '+t}}).then(carregarModulosDoCurso);}}

// ==========================================
// AUXILIARES (Users, Salas - ATUALIZADO COM HORAS)
// ==========================================

async function preencherTabelaUtilizadores(){const t=localStorage.getItem('token');const r=await fetch(`${API_URL}/users`,{headers:{'Authorization':'Bearer '+t}});todosUtilizadores=await r.json();desenharTabelaUsers(todosUtilizadores);}

function desenharTabelaUsers(l) {
    const t = document.getElementById('tabelaUsers');
    const u = JSON.parse(localStorage.getItem('user'));

    // --- ALTERAÇÃO AQUI ---
    // Agora verificamos se é Admin OU Secretaria
    // O método .includes verifica se a role do user está na lista de permitidos
    const temPermissao = ['Admin', 'Secretaria'].includes(u.role);
    
    if (!t) return;
    t.innerHTML = '';
    
    if (l.length === 0) {
        t.innerHTML = '<tr><td colspan="7">Nada.</td></tr>';
        return;
    }

    l.forEach(x => {
        const imgHtml = x.foto 
            ? `<img src="http://localhost:3000/uploads/${x.foto}" class="rounded-circle" width="30" height="30" style="object-fit:cover; margin-right:5px">`
            : `<div class="rounded-circle bg-secondary d-inline-flex justify-content-center align-items-center text-white" style="width:30px; height:30px; margin-right:5px">${x.nome_completo.charAt(0)}</div>`;

        // Se tiver permissão (Admin ou Secretaria), mostra os botões. Se não, mostra o cadeado.
        let a = temPermissao 
            ? `
                <button class="btn btn-sm btn-danger text-white me-1" onclick="gerarPDFUser(${x.id_user})" title="Exportar PDF"><i class="fas fa-file-pdf"></i></button>
                <button class="btn btn-sm btn-warning text-white me-1" onclick="abrirModalUser(${x.id_user},'${x.nome_completo}','${x.email}',${x.Role ? x.Role.id_role : 2}, ${x.horas_lecionadas || 0})"><i class="fas fa-edit"></i></button> 
                <button class="btn btn-sm btn-outline-danger" onclick="eliminarUser(${x.id_user})"><i class="fas fa-trash"></i></button>
              `
            : `<i class="fas fa-lock text-muted"></i>`;

        t.innerHTML += `
            <tr>
                <td>#${x.id_user}</td>
                <td class="fw-bold d-flex align-items-center">${imgHtml} ${x.nome_completo}</td>
                <td>${x.email}</td>
                <td><span class="badge bg-info text-dark">${x.Role ? x.Role.descricao : '-'}</span></td>
                <td class="text-center">${x.googleId ? '<i class="fab fa-google text-danger"></i>' : '<i class="fas fa-envelope text-secondary"></i>'}</td>
                <td><span class="badge bg-${x.conta_ativa ? 'success' : 'danger'}">${x.conta_ativa ? 'Ativo' : 'Inativo'}</span></td>
                <td>${a}</td>
            </tr>`;
    });
}

function filtrarUtilizadores(){const v=document.getElementById('pesquisaUser').value.toLowerCase();desenharTabelaUsers(todosUtilizadores.filter(u=>u.nome_completo.toLowerCase().includes(v)||u.email.toLowerCase().includes(v)));}

// ATUALIZAÇÃO: Recebe agora 'h' (horas)
function abrirModalUser(id,n,e,r,h=0){
    document.getElementById('editId').value=id;
    document.getElementById('editNome').value=n;
    document.getElementById('editEmail').value=e;
    document.getElementById('editRole').value=r;
    // Preenche o campo de horas
    const campoHoras = document.getElementById('editHoras');
    if(campoHoras) campoHoras.value = h;
    new bootstrap.Modal(document.getElementById('modalEditarUser')).show();
}

async function guardarEdicaoUser() {
    const id = document.getElementById('editId').value;
    const nome = document.getElementById('editNome').value;
    const email = document.getElementById('editEmail').value;
    const roleId = document.getElementById('editRole').value;
    const horas = document.getElementById('editHoras').value;
    
    // Novo: Input de ficheiro
    const fileInput = document.getElementById('editFotoInput');

    const token = localStorage.getItem('token');

    // CRIAR FORMDATA (Obrigatório para envio de ficheiros)
    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('email', email);
    formData.append('roleId', roleId);
    formData.append('horas_lecionadas', horas);

    // Se o utilizador escolheu uma foto, adiciona ao envio
    if (fileInput && fileInput.files[0]) {
        formData.append('foto', fileInput.files[0]);
    }

    try {
        const res = await fetch(`${API_URL}/users/${id}`, {
            method: 'PUT',
            headers: { 
                'Authorization': 'Bearer ' + token 
                // NOTA IMPORTANTE: NÃO adiciones 'Content-Type': 'application/json' aqui!
                // O fetch deteta o FormData e coloca o tipo certo automaticamente.
            },
            body: formData
        });

        if (res.ok) {
            alert('Guardado!');
            bootstrap.Modal.getInstance(document.getElementById('modalEditarUser')).hide();
            preencherTabelaUtilizadores();
        } else {
            alert('Erro ao guardar.');
        }
    } catch (e) { console.error(e); }
}


// ==========================================
// EXPORTAR PDF
// ==========================================
async function gerarPDFUser(id) {
    // 1. Encontrar o user na lista carregada
    const user = todosUtilizadores.find(u => u.id_user === id);
    if (!user) return alert("Utilizador não encontrado.");

    // 2. Preencher o Modelo HTML com os dados
    document.getElementById('pdfNome').innerText = user.nome_completo;
    document.getElementById('pdfId').innerText = user.id_user;
    document.getElementById('pdfEmail').innerText = user.email;
    document.getElementById('pdfRole').innerText = user.Role ? user.Role.descricao : 'Sem Perfil';
    document.getElementById('pdfEstado').innerText = user.conta_ativa ? 'Ativo' : 'Inativo';
    document.getElementById('pdfData').innerText = new Date().toLocaleString('pt-PT');

    // Foto (se não tiver, usa uma genérica)
    const imgElement = document.getElementById('pdfFoto');
    if (user.foto) {
        // Usa o proxy do CORS se necessário, ou caminho direto
        imgElement.src = `http://localhost:3000/uploads/${user.foto}`;
    } else {
        // Imagem placeholder cinzenta
        imgElement.src = 'https://via.placeholder.com/150?text=Sem+Foto';
    }

    // 3. Lógica Diferente para Formador vs Formando
    const divExtra = document.getElementById('pdfDadosExtra');
    
    if (user.Role && user.Role.descricao === 'Formador') {
        divExtra.innerHTML = `
            <p><strong>Total Horas Lecionadas:</strong> ${user.horas_lecionadas || 0} horas</p>
            <p>Este utilizador tem permissões para gerir avaliações e conteúdos de módulos.</p>
        `;
    } else if (user.Role && user.Role.descricao === 'Formando') {
        divExtra.innerHTML = `
            <p><strong>Curso Inscrito:</strong> ${user.curso || 'Não atribuído'}</p>
            <p>O formando deve cumprir com os requisitos de assiduidade.</p>
        `;
    } else {
        divExtra.innerHTML = `<p>Perfil Administrativo ou Secretaria.</p>`;
    }

    // 4. Configurar e Gerar o PDF
    const elemento = document.getElementById('templatePDF');
    
    // Mostramos temporariamente para o html2pdf conseguir "ver" e fotografar
    elemento.style.display = 'block'; 

    const opt = {
        margin:       0.5,
        filename:     `Ficha_${user.nome_completo.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true }, // useCORS é vital para carregar a foto do servidor
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    try {
        await html2pdf().set(opt).from(elemento).save();
    } catch (error) {
        console.error("Erro ao gerar PDF", error);
        alert("Erro ao gerar PDF. Verifica a consola.");
    } finally {
        // Voltar a esconder o modelo
        elemento.style.display = 'none';
    }
}

// ==========================================
// LÓGICA DE INSCRIÇÕES (SECRETARIA/ADMIN)
// ==========================================
let cursoSelecionadoId = null;

async function abrirGestaoAlunos(idCurso, nomeCurso) {
    cursoSelecionadoId = idCurso;
    document.getElementById('lblNomeCursoTurma').innerText = nomeCurso;
    
    // 1. Carregar lista de alunos já inscritos
    await carregarInscritos();
    
    // 2. Carregar lista de todos os formandos para o dropdown
    await carregarDropdownFormandos();

    new bootstrap.Modal(document.getElementById('modalInscricoes')).show();
}

async function carregarInscritos() {
    const token = localStorage.getItem('token');
    const tbody = document.getElementById('listaAlunosInscritos');
    
    const res = await fetch(`${API_URL}/cursos/${cursoSelecionadoId}/alunos`, {
        headers: { 'Authorization': 'Bearer ' + token }
    });
    const alunos = await res.json();

    tbody.innerHTML = '';
    if (alunos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3">Ainda não há alunos nesta turma.</td></tr>';
        return;
    }

    alunos.forEach(a => {
        const fotoUrl = a.foto ? `http://localhost:3000/uploads/${a.foto}` : 'https://via.placeholder.com/40';
        
        tbody.innerHTML += `
            <tr>
                <td><img src="${fotoUrl}" class="rounded-circle" width="40" height="40" style="object-fit:cover"></td>
                <td>${a.nome_completo}</td>
                <td>${a.email}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-danger" onclick="removerInscricao(${a.id_user})">
                        <i class="fas fa-user-minus"></i>
                    </button>
                </td>
            </tr>
        `;
    });
}

async function carregarDropdownFormandos() {
    const sel = document.getElementById('selAlunoInscricao');
    // Reutiliza a lista global se já existir, senão busca
    if (todosUtilizadores.length === 0) await preencherTabelaUtilizadores();

    sel.innerHTML = '<option value="">-- Selecionar Aluno --</option>';
    
    todosUtilizadores.forEach(u => {
        // Filtra apenas Formandos (ou Alunos, conforme a tua Role)
        if (u.Role && (u.Role.descricao === 'Formando' || u.Role.descricao === 'Aluno')) {
            sel.innerHTML += `<option value="${u.id_user}">${u.nome_completo} (${u.email})</option>`;
        }
    });
}

async function guardarInscricao() {
    const idAluno = document.getElementById('selAlunoInscricao').value;
    if (!idAluno) return alert("Escolhe um aluno!");

    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/cursos/${cursoSelecionadoId}/alunos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ userId: idAluno })
        });

        if (res.ok) {
            alert("Aluno matriculado!");
            carregarInscritos(); // Atualiza a tabela
        } else {
            alert("Erro: O aluno já deve estar inscrito.");
        }
    } catch (e) { console.error(e); }
}

async function removerInscricao(idAluno) {
    if(!confirm("Remover este aluno do curso?")) return;
    const token = localStorage.getItem('token');
    
    try {
        await fetch(`${API_URL}/cursos/${cursoSelecionadoId}/alunos/${idAluno}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        carregarInscritos();
    } catch (e) { console.error(e); }
}

async function eliminarUser(id){if(confirm("Apagar?")){const t=localStorage.getItem('token');await fetch(`${API_URL}/users/${id}`,{method:'DELETE',headers:{'Authorization':'Bearer '+t}}).then(preencherTabelaUtilizadores);}}
async function preencherTabelaSalas(){const t=localStorage.getItem('token');const r=await fetch(`${API_URL}/salas`,{headers:{'Authorization':'Bearer '+t}});todasSalas=await r.json();desenharTabelaSalas(todasSalas);}
function desenharTabelaSalas(l){const t=document.getElementById('tabelaSalas');if(!t)return;t.innerHTML='';if(l.length===0){t.innerHTML='<tr><td colspan="5">Nada.</td></tr>';return;}l.forEach(s=>{t.innerHTML+=`<tr><td>#${s.id_sala}</td><td class="fw-bold">${s.nome}</td><td><span class="badge bg-secondary">${s.tipo}</span></td><td>${s.capacidade} pax</td><td><button class="btn btn-sm btn-warning text-white" onclick="abrirModalSala(${s.id_sala},'${s.nome}','${s.tipo}',${s.capacidade})"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-danger" onclick="eliminarSala(${s.id_sala})"><i class="fas fa-trash"></i></button></td></tr>`;});}
function filtrarSalas(){const v=document.getElementById('pesquisaSala').value.toLowerCase();desenharTabelaSalas(todasSalas.filter(s=>s.nome.toLowerCase().includes(v)));}
function abrirModalSala(id=null,n='',tp='Teórica',c=''){document.getElementById('salaId').value=id||'';document.getElementById('salaNome').value=n;document.getElementById('salaTipo').value=tp;document.getElementById('salaCapacidade').value=c;document.getElementById('tituloModalSala').innerText=id?'Editar':'Nova';new bootstrap.Modal(document.getElementById('modalSala')).show();}
async function guardarSala(){const id=document.getElementById('salaId').value;const n=document.getElementById('salaNome').value;const tp=document.getElementById('salaTipo').value;const c=document.getElementById('salaCapacidade').value;const t=localStorage.getItem('token');const m=id?'PUT':'POST';const u=id?`${API_URL}/salas/${id}`:`${API_URL}/salas`;await fetch(u,{method:m,headers:{'Content-Type':'application/json','Authorization':'Bearer '+t},body:JSON.stringify({nome:n,tipo:tp,capacidade:c})}).then(()=>{alert('Guardado');bootstrap.Modal.getInstance(document.getElementById('modalSala')).hide();preencherTabelaSalas();});}
async function eliminarSala(id){if(confirm("Apagar?")){const t=localStorage.getItem('token');await fetch(`${API_URL}/salas/${id}`,{method:'DELETE',headers:{'Authorization':'Bearer '+t}}).then(preencherTabelaSalas);}}

function logout(){localStorage.clear();window.location.href='login.html';}