// ==========================================
// CONFIGURAÇÃO INICIAL
// ==========================================
const API_URL = 'http://localhost:3000/api'; 
const SERVER_URL = 'http://localhost:3000'; 

// Variáveis Globais
let todosUtilizadores = [];
let todosCursos = [];
let todosModulos = [];
let todasSalas = [];
let calendar; 

console.log("🚀 Dashboard.js a iniciar... API:", API_URL);

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

    // Carregar conteúdo inicial
    carregarConteudo('inicio');
});

// ==========================================
// ROUTER (NAVEGAÇÃO)
// ==========================================
async function carregarConteudo(tipo) {
    const conteudo = document.getElementById('conteudo-principal');
    const titulo = document.getElementById('titulo-seccao');

    // --- INICIO ---
    if (tipo === 'inicio') {
        titulo.innerText = 'Estatísticas Gerais';
        conteudo.innerHTML = `
            <div class="row g-3 mb-4">
                <div class="col-md-4"><div class="p-3 bg-white shadow-sm border-start border-4 border-success rounded"><h3 class="fs-2" id="stat-decorrer">...</h3><p class="text-muted mb-0">Cursos a Decorrer</p></div></div>
                <div class="col-md-4"><div class="p-3 bg-white shadow-sm border-start border-4 border-secondary rounded"><h3 class="fs-2" id="stat-terminados">...</h3><p class="text-muted mb-0">Cursos Terminados</p></div></div>
                <div class="col-md-4"><div class="p-3 bg-white shadow-sm border-start border-4 border-primary rounded"><h3 class="fs-2" id="stat-formandos">...</h3><p class="text-muted mb-0">Formandos Ativos</p></div></div>
            </div>
            <div class="row g-3">
                <div class="col-md-6"><div class="card shadow-sm border-0 h-100"><div class="card-header bg-white fw-bold">Cursos por Área</div><div class="card-body"><ul class="list-group list-group-flush" id="lista-areas"><li class="list-group-item">A carregar...</li></ul></div></div></div>
                <div class="col-md-6"><div class="card shadow-sm border-0 h-100"><div class="card-header bg-warning text-dark fw-bold"><i class="fas fa-trophy me-2"></i>Top 10 Formadores (Horas)</div><div class="card-body p-0"><table class="table table-striped mb-0"><thead><tr><th>Nome</th><th class="text-end">Horas</th></tr></thead><tbody id="tabela-top-formadores"><tr><td colspan="2" class="text-center p-3">A carregar...</td></tr></tbody></table></div></div></div>
            </div>`;
        atualizarEstatisticasCompletas();
    }
    
    // --- HORÁRIOS ---
    else if (tipo === 'horarios') {
        titulo.innerText = 'Mapa de Aulas (Calendário)';
        conteudo.innerHTML = `<div class="card shadow-sm border-0"><div class="card-body p-0"><div id="calendar" style="min-height: 800px;"></div></div></div>`;
        setTimeout(() => iniciarCalendario(), 100);
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
            <div id="alerta-proximos-cursos" class="mb-4" style="display: none;"><div class="card border-warning shadow-sm"><div class="card-header bg-warning text-dark fw-bold"><i class="fas fa-hourglass-half me-2"></i>Arranques Próximos (60 dias)</div><div class="card-body bg-light"><ul id="lista-proximos-cursos" class="list-group list-group-flush bg-transparent"></ul></div></div></div>
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

    // --- CANDIDATURAS (CORRIGIDO) ---
    else if (tipo === 'candidaturas') {
        titulo.innerText = 'Gestão de Candidaturas';
        conteudo.innerHTML = `
            <div class="alert alert-info shadow-sm"><i class="fas fa-info-circle me-2"></i>Aprova ou rejeita as inscrições nos cursos.</div>
            <div class="card shadow-sm border-0">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle">
                            <thead class="table-dark"><tr><th>Foto</th><th>Nome</th><th>Curso</th><th>Estado</th><th class="text-end">Decisão</th></tr></thead>
                            <tbody id="tabelaCandidaturas"><tr><td colspan="5" class="text-center">A carregar...</td></tr></tbody>
                        </table>
                    </div>
                </div>
            </div>`;
        carregarCandidaturas(); 
    }
}

// ==========================================
// FUNÇÕES AUXILIARES (Estatísticas, Cursos, etc)
// ==========================================
async function atualizarEstatisticasCompletas() {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`${API_URL}/stats`, { headers: { 'Authorization': 'Bearer ' + token } });
        const data = await res.json();
        document.getElementById('stat-decorrer').innerText = data.cursosDecorrer;
        document.getElementById('stat-terminados').innerText = data.cursosTerminados;
        document.getElementById('stat-formandos').innerText = data.totalFormandos;
        const listaAreas = document.getElementById('lista-areas');
        listaAreas.innerHTML = '';
        if (data.cursosPorArea.length === 0) listaAreas.innerHTML = '<li class="list-group-item">Sem cursos.</li>';
        data.cursosPorArea.forEach(item => { listaAreas.innerHTML += `<li class="list-group-item d-flex justify-content-between align-items-center">${item.area}<span class="badge bg-primary rounded-pill">${item.total}</span></li>`; });
        const tabelaTop = document.getElementById('tabela-top-formadores');
        tabelaTop.innerHTML = '';
        if (data.topFormadores.length === 0) tabelaTop.innerHTML = '<tr><td colspan="2" class="text-center p-3">Sem dados.</td></tr>';
        data.topFormadores.forEach(f => { tabelaTop.innerHTML += `<tr><td>${f.nome_completo}</td><td class="text-end fw-bold">${f.horas_lecionadas} h</td></tr>`; });
    } catch (e) { console.error("Erro stats:", e); }
}

// ==========================================
// GESTÃO DE CANDIDATURAS (CORRIGIDO)
// ==========================================
async function carregarCandidaturas() {
    const tbody = document.getElementById('tabelaCandidaturas');
    if (!tbody) return;

    const token = localStorage.getItem('token');
    
    try {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">A carregar dados...</td></tr>';

        const res = await fetch(`${API_URL}/inscricoes/pendentes`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (res.ok) {
            const pendentes = await res.json();
            tbody.innerHTML = '';

            if (pendentes.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4">Não há candidaturas pendentes.</td></tr>';
                return;
            }

            pendentes.forEach(p => {
                // --- A CORREÇÃO ESTÁ AQUI ---
                // Definimos as variáveis ANTES de usar no HTML
                const userNome = p.User ? p.User.nome_completo : 'Aluno Removido';
                const cursoNome = p.Curso ? p.Curso.nome : 'Curso Removido';
                const idParaBotao = p.id || p.id_inscricao;

                // Tratamento da Foto
                let fotoUser = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                if (p.User && p.User.foto) {
                    fotoUser = p.User.foto.startsWith('http') ? p.User.foto : `${SERVER_URL}/uploads/${p.User.foto}`;
                }

                tbody.innerHTML += `
                    <tr>
                        <td>
                            <img src="${fotoUser}" class="rounded-circle" width="40" height="40" style="object-fit:cover">
                        </td>
                        <td class="fw-bold">${userNome}</td> <td><span class="badge bg-primary">${cursoNome}</span></td> <td><span class="badge bg-warning text-dark">Pendente</span></td>
                        <td>
                            <button class="btn btn-sm btn-success me-2" onclick="decidirCandidatura(${idParaBotao}, 'Aceite')">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="decidirCandidatura(${idParaBotao}, 'Rejeitado')">
                                <i class="fas fa-times"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        } else {
            console.error("Erro Backend:", await res.text());
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Erro ao carregar dados.</td></tr>';
        }
    } catch (e) {
        console.error("Erro JS:", e);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Erro de conexão (Frontend).</td></tr>';
    }
}

async function decidirCandidatura(idInscricao, decisao) {
    // 1. SEGURANÇA: Verificar se o ID chegou bem
    if (!idInscricao) {
        console.error("❌ Erro: O ID da inscrição é inválido ou indefinido.");
        alert("Erro técnico: ID da inscrição não encontrado.");
        return;
    }

    // 2. CONFIRMAÇÃO
    if (!confirm(`Tens a certeza que queres marcar como ${decisao}?`)) return;

    const token = localStorage.getItem('token');

    try {
        // 3. ENVIO PARA O SERVIDOR
        const res = await fetch(`${API_URL}/inscricoes/${idInscricao}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': 'Bearer ' + token 
            }, 
            body: JSON.stringify({ decisao: decisao })
        });

        // 4. RESPOSTA
        if (res.ok) {
            alert(`✅ Candidatura ${decisao} com sucesso!`);
            carregarCandidaturas(); // Atualiza a tabela para a linha desaparecer
        } else {
            const erro = await res.json();
            alert("Erro: " + (erro.msg || "Não foi possível processar o pedido."));
        }
    } catch (e) { 
        console.error("Erro de conexão:", e); 
        alert("Erro de conexão ao servidor.");
    }
}

// === OUTRAS FUNÇÕES DO SISTEMA  ===
async function preencherTabelaCursos(){const t=localStorage.getItem('token');try{const r=await fetch(`${API_URL}/cursos`,{headers:{'Authorization':'Bearer '+t}});todosCursos=await r.json();verificarArranquesProximos(todosCursos);desenharTabelaCursos(todosCursos);}catch(e){document.getElementById('tabelaCursos').innerHTML='<tr><td colspan="7" class="text-danger text-center">Erro.</td></tr>';}}
function verificarArranquesProximos(c){const l=document.getElementById('lista-proximos-cursos');const h=new Date();h.setHours(0,0,0,0);let t=false;if(l)l.innerHTML='';c.forEach(x=>{const d=new Date(x.data_inicio);d.setHours(0,0,0,0);const diff=Math.ceil((d-h)/(1000*60*60*24));if(diff>=0&&diff<=60){t=true;l.innerHTML+=`<li class="list-group-item d-flex justify-content-between bg-transparent"><span><strong>${x.nome}</strong> - ${d.toLocaleDateString()}</span><span class="badge bg-${diff<15?'danger':'warning text-dark'}">Faltam ${diff} dias</span></li>`;}});if(document.getElementById('alerta-proximos-cursos'))document.getElementById('alerta-proximos-cursos').style.display=t?'block':'none';}
function desenharTabelaCursos(l){const t=document.getElementById('tabelaCursos');const u=JSON.parse(localStorage.getItem('user'));const pg=['Admin','Secretaria'].includes(u.role);if(!t)return;t.innerHTML='';if(l.length===0){t.innerHTML='<tr><td colspan="7" class="text-center text-muted">Vazio.</td></tr>';return;}l.forEach(c=>{const b=pg?`<button class="btn btn-sm btn-primary me-1" onclick="abrirGestaoAlunos(${c.id_curso},'${c.nome}')"><i class="fas fa-user-graduate"></i></button><button class="btn btn-sm btn-warning text-white" onclick="abrirModalCurso(${c.id_curso},'${c.nome}','${c.area}','${c.data_inicio}','${c.data_fim}',${c.status})"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-danger" onclick="eliminarCurso(${c.id_curso})"><i class="fas fa-trash"></i></button>`:'';t.innerHTML+=`<tr><td>#${c.id_curso}</td><td class="fw-bold">${c.nome}</td><td><span class="badge bg-secondary">${c.area}</span></td><td>${new Date(c.data_inicio).toLocaleDateString()}</td><td>${new Date(c.data_fim).toLocaleDateString()}</td><td>${c.status?'<span class="badge bg-success">Ativo</span>':'<span class="badge bg-secondary">Inativo</span>'}</td><td>${b}</td></tr>`;});}
function filtrarCursos(){const v=document.getElementById('pesquisaCurso').value.toLowerCase();desenharTabelaCursos(todosCursos.filter(c=>c.nome.toLowerCase().includes(v)));}
function abrirModalCurso(id=null,n='',a='TPSI',i='',f='',s=false){document.getElementById('cursoId').value=id||'';document.getElementById('cursoNome').value=n;document.getElementById('cursoArea').value=a;document.getElementById('cursoInicio').value=i?i.split('T')[0]:'';document.getElementById('cursoFim').value=f?f.split('T')[0]:'';const ck=document.getElementById('cursoStatus');if(ck)ck.checked=s;document.getElementById('divStatusCurso').style.display=id?'block':'none';document.getElementById('tituloModalCurso').innerText=id?'Editar':'Novo';new bootstrap.Modal(document.getElementById('modalCurso')).show();}
async function guardarCurso(){const id=document.getElementById('cursoId').value;const u=id?`${API_URL}/cursos/${id}`:`${API_URL}/cursos`;const m=id?'PUT':'POST';await fetch(u,{method:m,headers:{'Content-Type':'application/json','Authorization':'Bearer '+localStorage.getItem('token')},body:JSON.stringify({nome:document.getElementById('cursoNome').value,area:document.getElementById('cursoArea').value,data_inicio:document.getElementById('cursoInicio').value,data_fim:document.getElementById('cursoFim').value,status:document.getElementById('cursoStatus')?document.getElementById('cursoStatus').checked:false})}).then(()=>{alert('Guardado');bootstrap.Modal.getInstance(document.getElementById('modalCurso')).hide();preencherTabelaCursos();});}
async function eliminarCurso(id){if(confirm("Apagar?")){await fetch(`${API_URL}/cursos/${id}`,{method:'DELETE',headers:{'Authorization':'Bearer '+localStorage.getItem('token')}});preencherTabelaCursos();}}

// Inscrições Manuais
let cursoSelecionadoId=null;
async function abrirGestaoAlunos(id,n){cursoSelecionadoId=id;document.getElementById('lblNomeCursoTurma').innerText=n;await carregarInscritos();await carregarDropdownFormandos();new bootstrap.Modal(document.getElementById('modalInscricoes')).show();}
async function carregarInscritos(){const tb=document.getElementById('listaAlunosInscritos');const res=await fetch(`${API_URL}/cursos/${cursoSelecionadoId}/alunos`,{headers:{'Authorization':'Bearer '+localStorage.getItem('token')}});const a=await res.json();tb.innerHTML='';if(a.length===0){tb.innerHTML='<tr><td colspan="4" class="text-center">Vazio.</td></tr>';return;}a.forEach(x=>{const f=x.foto?`${SERVER_URL}/uploads/${x.foto}`:'https://via.placeholder.com/40';tb.innerHTML+=`<tr><td><img src="${f}" class="rounded-circle" width="30"></td><td>${x.nome_completo}</td><td>${x.email}</td><td class="text-end"><button class="btn btn-sm btn-outline-danger" onclick="removerInscricao(${x.id_user})"><i class="fas fa-user-minus"></i></button></td></tr>`;});}
async function carregarDropdownFormandos(){const s=document.getElementById('selAlunoInscricao');if(todosUtilizadores.length===0)await preencherTabelaUtilizadores();s.innerHTML='<option value="">Escolher...</option>';todosUtilizadores.forEach(u=>{if(u.Role&&(u.Role.descricao==='Formando'||u.Role.descricao==='Aluno'))s.innerHTML+=`<option value="${u.id_user}">${u.nome_completo}</option>`;});}
async function guardarInscricao(){const uid=document.getElementById('selAlunoInscricao').value;if(!uid)return alert('Escolhe um aluno');const res=await fetch(`${API_URL}/cursos/${cursoSelecionadoId}/alunos`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+localStorage.getItem('token')},body:JSON.stringify({userId:uid})});if(res.ok){alert('Adicionado');carregarInscritos();}else{alert('Erro/Já existe');}}
async function removerInscricao(uid){if(!confirm('Remover?'))return;await fetch(`${API_URL}/cursos/${cursoSelecionadoId}/alunos/${uid}`,{method:'DELETE',headers:{'Authorization':'Bearer '+localStorage.getItem('token')}});carregarInscritos();}

// Modulos
async function preencherSelectCursos(){const r=await fetch(`${API_URL}/cursos`,{headers:{'Authorization':'Bearer '+localStorage.getItem('token')}});const c=await r.json();const s=document.getElementById('filtroCursoModulo');s.innerHTML='<option value="">Escolhe...</option>';c.forEach(x=>s.innerHTML+=`<option value="${x.id_curso}">${x.nome}</option>`);}
async function carregarModulosDoCurso(){const cid=document.getElementById('filtroCursoModulo').value;const t=document.getElementById('tabelaModulos');const btn=document.getElementById('btnNovoModulo');if(!cid){btn.disabled=true;t.innerHTML='<tr><td>Escolhe curso.</td></tr>';return;}btn.disabled=false;const r=await fetch(`${API_URL}/modulos?cursoId=${cid}`,{headers:{'Authorization':'Bearer '+localStorage.getItem('token')}});const m=await r.json();t.innerHTML='';if(m.length===0){t.innerHTML='<tr><td colspan="5">Vazio.</td></tr>';return;}m.forEach(x=>{t.innerHTML+=`<tr><td>#${x.id_modulo}</td><td>${x.nome}</td><td>${x.Formador?x.Formador.nome_completo:'-'}<br>${x.Sala?x.Sala.nome:'-'}</td><td>${x.descricao||'-'}</td><td class="text-end"><button class="btn btn-sm btn-outline-warning" onclick="abrirModalModulo(${x.id_modulo},'${x.nome}','${x.descricao}','${x.formadorId||''}','${x.salaId||''}')"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-outline-danger" onclick="eliminarModulo(${x.id_modulo})"><i class="fas fa-trash"></i></button></td></tr>`;});}
async function preencherSelectsModalModulo(){const t=localStorage.getItem('token');const u=await(await fetch(`${API_URL}/users`,{headers:{'Authorization':'Bearer '+t}})).json();const sf=document.getElementById('moduloFormador');sf.innerHTML='<option value="">Sem Formador</option>';u.forEach(x=>{if(x.Role&&x.Role.descricao.includes('Formador'))sf.innerHTML+=`<option value="${x.id_user}">${x.nome_completo}</option>`;});const s=await(await fetch(`${API_URL}/salas`,{headers:{'Authorization':'Bearer '+t}})).json();const ss=document.getElementById('moduloSala');ss.innerHTML='<option value="">Sem Sala</option>';s.forEach(x=>ss.innerHTML+=`<option value="${x.id_sala}">${x.nome}</option>`);}
async function abrirModalModulo(id=null,n='',d='',f='',s=''){await preencherSelectsModalModulo();document.getElementById('moduloId').value=id||'';document.getElementById('moduloCursoId').value=document.getElementById('filtroCursoModulo').value;document.getElementById('moduloNome').value=n;document.getElementById('moduloDescricao').value=d;document.getElementById('moduloFormador').value=f;document.getElementById('moduloSala').value=s;document.getElementById('tituloModalModulo').innerText=id?'Editar':'Novo';new bootstrap.Modal(document.getElementById('modalModulo')).show();}
async function guardarModulo(){const id=document.getElementById('moduloId').value;const u=id?`${API_URL}/modulos/${id}`:`${API_URL}/modulos`;const m=id?'PUT':'POST';await fetch(u,{method:m,headers:{'Content-Type':'application/json','Authorization':'Bearer '+localStorage.getItem('token')},body:JSON.stringify({nome:document.getElementById('moduloNome').value,descricao:document.getElementById('moduloDescricao').value,cursoId:document.getElementById('moduloCursoId').value,formadorId:document.getElementById('moduloFormador').value,salaId:document.getElementById('moduloSala').value})}).then(()=>{alert('Guardado');bootstrap.Modal.getInstance(document.getElementById('modalModulo')).hide();carregarModulosDoCurso();});}
async function eliminarModulo(id){if(confirm("Apagar?")){await fetch(`${API_URL}/modulos/${id}`,{method:'DELETE',headers:{'Authorization':'Bearer '+localStorage.getItem('token')}});carregarModulosDoCurso();}}

// Users & Salas & PDF
async function preencherTabelaUtilizadores(){const r=await fetch(`${API_URL}/users`,{headers:{'Authorization':'Bearer '+localStorage.getItem('token')}});todosUtilizadores=await r.json();desenharTabelaUsers(todosUtilizadores);}
function desenharTabelaUsers(l) {
    const t = document.getElementById('tabelaUsers');
    const u = JSON.parse(localStorage.getItem('user'));
    const isAdmin = u.role === 'Admin';
    if (!t) return;
    t.innerHTML = '';
    if (l.length === 0) { t.innerHTML = '<tr><td colspan="7" class="text-center">Nada.</td></tr>'; return; }
    l.forEach(x => {
        const imgHtml = x.foto ? `<img src="${SERVER_URL}/uploads/${x.foto}" class="rounded-circle" width="30" height="30" style="object-fit:cover; margin-right:5px">` : `<div class="rounded-circle bg-secondary d-inline-flex justify-content-center align-items-center text-white" style="width:30px; height:30px; margin-right:5px">${x.nome_completo.charAt(0)}</div>`;
        const botoesAcao = isAdmin ? `<button class="btn btn-sm btn-danger text-white me-1" onclick="gerarPDFUser(${x.id_user})" title="PDF"><i class="fas fa-file-pdf"></i></button><button class="btn btn-sm btn-warning text-white me-1" onclick="abrirModalUser(${x.id_user},'${x.nome_completo}','${x.email}',${x.Role ? x.Role.id_role : 2}, ${x.horas_lecionadas || 0})"><i class="fas fa-edit"></i></button><button class="btn btn-sm btn-outline-danger" onclick="eliminarUser(${x.id_user})"><i class="fas fa-trash"></i></button>` : `<button class="btn btn-sm btn-danger text-white" onclick="gerarPDFUser(${x.id_user})" title="PDF"><i class="fas fa-file-pdf"></i></button>`;
        t.innerHTML += `<tr><td>#${x.id_user}</td><td class="fw-bold d-flex align-items-center">${imgHtml}${x.nome_completo}</td><td>${x.email}</td><td><span class="badge bg-info text-dark">${x.Role ? x.Role.descricao : '-'}</span></td><td class="text-center">${x.googleId ? '<i class="fab fa-google text-danger"></i>' : '<i class="fas fa-envelope text-secondary"></i>'}</td><td><span class="badge bg-${x.conta_ativa ? 'success' : 'danger'}">${x.conta_ativa ? 'Ativo' : 'Inativo'}</span></td><td>${botoesAcao}</td></tr>`;
    });
}

async function guardarEdicaoUser() {
    const id = document.getElementById('editId').value;
    const nome = document.getElementById('editNome').value;
    const email = document.getElementById('editEmail').value;
    
    // Pegar o valor da Role
    const roleSelect = document.getElementById('editRole');
    const roleId = roleSelect.value; // Isto deve ser "1", "2", etc.

    console.log("Frontend - A enviar Role ID:", roleId); // <--- DEBUG

    const horas = document.getElementById('editHoras').value;
    const fileInput = document.getElementById('editFotoInput');
    const token = localStorage.getItem('token');

    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('email', email);
    formData.append('roleId', roleId); // Adiciona ao pacote
    formData.append('horas_lecionadas', horas);

    if (fileInput && fileInput.files[0]) {
        formData.append('foto', fileInput.files[0]);
    }

    try {
        const res = await fetch(`${API_URL}/users/${id}`, {
            method: 'PUT',
            headers: { 'Authorization': 'Bearer ' + token },
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

function filtrarUtilizadores(){const v=document.getElementById('pesquisaUser').value.toLowerCase();desenharTabelaUsers(todosUtilizadores.filter(u=>u.nome_completo.toLowerCase().includes(v)||u.email.toLowerCase().includes(v)));}
function abrirModalUser(id,n,e,r,h){document.getElementById('editId').value=id;document.getElementById('editNome').value=n;document.getElementById('editEmail').value=e;document.getElementById('editRole').value=r;if(document.getElementById('editHoras'))document.getElementById('editHoras').value=h;new bootstrap.Modal(document.getElementById('modalEditarUser')).show();}
async function eliminarUser(id){if(confirm("Apagar?")){await fetch(`${API_URL}/users/${id}`,{method:'DELETE',headers:{'Authorization':'Bearer '+localStorage.getItem('token')}});preencherTabelaUtilizadores();}}
async function gerarPDFUser(id){const u=todosUtilizadores.find(x=>x.id_user===id);if(!u)return;document.getElementById('pdfNome').innerText=u.nome_completo;document.getElementById('pdfId').innerText=u.id_user;document.getElementById('pdfEmail').innerText=u.email;document.getElementById('pdfRole').innerText=u.Role?u.Role.descricao:'-';document.getElementById('pdfEstado').innerText=u.conta_ativa?'Ativo':'Inativo';document.getElementById('pdfData').innerText=new Date().toLocaleDateString();document.getElementById('pdfFoto').src=u.foto?`${SERVER_URL}/uploads/${u.foto}`:'https://via.placeholder.com/150';const el=document.getElementById('templatePDF');el.style.display='block';await html2pdf().from(el).save(`Ficha_${u.nome_completo}.pdf`);el.style.display='none';}
async function preencherTabelaSalas(){const r=await fetch(`${API_URL}/salas`,{headers:{'Authorization':'Bearer '+localStorage.getItem('token')}});todasSalas=await r.json();desenharTabelaSalas(todasSalas);}
function desenharTabelaSalas(l){const t=document.getElementById('tabelaSalas');if(!t)return;t.innerHTML='';if(l.length===0){t.innerHTML='<tr><td>Vazio.</td></tr>';return;}l.forEach(s=>{t.innerHTML+=`<tr><td>#${s.id_sala}</td><td>${s.nome}</td><td>${s.tipo}</td><td>${s.capacidade}</td><td><button class="btn btn-sm btn-warning" onclick="abrirModalSala(${s.id_sala},'${s.nome}','${s.tipo}',${s.capacidade})"><i class="fas fa-edit"></i></button> <button class="btn btn-sm btn-danger" onclick="eliminarSala(${s.id_sala})"><i class="fas fa-trash"></i></button></td></tr>`;});}
function filtrarSalas(){const v=document.getElementById('pesquisaSala').value.toLowerCase();desenharTabelaSalas(todasSalas.filter(s=>s.nome.toLowerCase().includes(v)));}
function abrirModalSala(id=null,n='',tp='Teórica',c=''){document.getElementById('salaId').value=id||'';document.getElementById('salaNome').value=n;document.getElementById('salaTipo').value=tp;document.getElementById('salaCapacidade').value=c;document.getElementById('tituloModalSala').innerText=id?'Editar':'Nova';new bootstrap.Modal(document.getElementById('modalSala')).show();}
async function guardarSala(){const id=document.getElementById('salaId').value;const u=id?`${API_URL}/salas/${id}`:`${API_URL}/salas`;const m=id?'PUT':'POST';await fetch(u,{method:m,headers:{'Content-Type':'application/json','Authorization':'Bearer '+localStorage.getItem('token')},body:JSON.stringify({nome:document.getElementById('salaNome').value,tipo:document.getElementById('salaTipo').value,capacidade:document.getElementById('salaCapacidade').value})});alert('Guardado');bootstrap.Modal.getInstance(document.getElementById('modalSala')).hide();preencherTabelaSalas();}
async function eliminarSala(id){if(confirm("Apagar?")){await fetch(`${API_URL}/salas/${id}`,{method:'DELETE',headers:{'Authorization':'Bearer '+localStorage.getItem('token')}});preencherTabelaSalas();}}

// Calendário
async function iniciarCalendario(){const el=document.getElementById('calendar');if(!el)return;const r=await fetch(`${API_URL}/horarios`,{headers:{'Authorization':'Bearer '+localStorage.getItem('token')}});const h=await r.json();const evt=h.map(x=>({id:x.id_horario,title:`${x.Modulo?x.Modulo.nome:'-'} (${x.Sala?x.Sala.nome:'-'})`,start:`${x.data_aula.split('T')[0]}T${x.hora_inicio}`,end:`${x.data_aula.split('T')[0]}T${x.hora_fim}`,color:x.Sala&&x.Sala.nome.includes('1')?'#28a745':'#3788d8'}));calendar=new FullCalendar.Calendar(el,{initialView:'timeGridWeek',locale:'pt',headerToolbar:{left:'prev,next today',center:'title',right:'dayGridMonth,timeGridWeek'},slotMinTime:'08:00',slotMaxTime:'23:00',allDaySlot:false,events:evt,height:'auto',dateClick:i=>abrirModalHorario(i.dateStr.split('T')[0],i.dateStr.split('T')[1].slice(0,5)),eventClick:i=>{if(confirm('Apagar?'))eliminarHorario(i.event.id)}});calendar.render();}
async function abrirModalHorario(d='',h=''){await carregarSelectsHorario();if(d)document.getElementById('hData').value=d;if(h){document.getElementById('hInicio').value=h;const[hr,mn]=h.split(':');document.getElementById('hFim').value=`${(parseInt(hr)+1).toString().padStart(2,'0')}:${mn}`;}new bootstrap.Modal(document.getElementById('modalHorario')).show();}
async function carregarSelectsHorario(){const t=localStorage.getItem('token');const s=await(await fetch(`${API_URL}/salas`,{headers:{'Authorization':'Bearer '+t}})).json();const m=await(await fetch(`${API_URL}/modulos`,{headers:{'Authorization':'Bearer '+t}})).json();document.getElementById('hSala').innerHTML=s.map(x=>`<option value="${x.id_sala}">${x.nome}</option>`).join('');document.getElementById('hModulo').innerHTML=m.map(x=>`<option value="${x.id_modulo}">${x.nome} (${x.Curso?x.Curso.nome:'-'})</option>`).join('');}
async function guardarHorario(){const d={data_aula:document.getElementById('hData').value,hora_inicio:document.getElementById('hInicio').value,hora_fim:document.getElementById('hFim').value,salaId:document.getElementById('hSala').value,moduloId:document.getElementById('hModulo').value};const r=await fetch(`${API_URL}/horarios`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+localStorage.getItem('token')},body:JSON.stringify(d)});if(r.ok){alert('Agendado');bootstrap.Modal.getInstance(document.getElementById('modalHorario')).hide();iniciarCalendario();}else{alert((await r.json()).msg);}}
async function eliminarHorario(id){await fetch(`${API_URL}/horarios/${id}`,{method:'DELETE',headers:{'Authorization':'Bearer '+localStorage.getItem('token')}});iniciarCalendario();}

function logout(){localStorage.clear();window.location.href='login.html';}
function toggleChat(){const w=document.getElementById('chatWindow');w.style.display=w.style.display==='flex'?'none':'flex';if(w.style.display==='flex')setTimeout(()=>document.getElementById('chatInput').focus(),100);}
async function enviarMensagem(){const i=document.getElementById('chatInput');const t=i.value.trim();const b=document.getElementById('chatBody');if(!t)return;b.innerHTML+=`<div class="msg msg-user">${t}</div>`;i.value='';b.scrollTop=b.scrollHeight;try{const r=await fetch(`${API_URL}/chat`,{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+localStorage.getItem('token')},body:JSON.stringify({mensagem:t})});const d=await r.json();b.innerHTML+=`<div class="msg msg-bot">${d.reply}</div>`;}catch(e){b.innerHTML+='<div class="msg msg-bot text-danger">Erro.</div>';}b.scrollTop=b.scrollHeight;}