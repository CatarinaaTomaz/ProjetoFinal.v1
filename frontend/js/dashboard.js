const API_URL = 'http://localhost:3000/api';

document.addEventListener("DOMContentLoaded", () => {
    // 1. Verificações de Login (Google/Token)
    const params = new URLSearchParams(window.location.search);
    const tokenUrl = params.get('token');
    const userUrl = params.get('user');

    if (tokenUrl && userUrl) {
        localStorage.setItem('token', tokenUrl);
        localStorage.setItem('user', decodeURIComponent(userUrl));
        window.history.replaceState({}, document.title, "dashboard.html");
    }

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Menu Toggle
    const el = document.getElementById("wrapper");
    const toggleButton = document.getElementById("menu-toggle");
    if(toggleButton) {
        toggleButton.onclick = function () {
            el.classList.toggle("toggled");
        };
    }

    // 3. Carregar a página inicial por defeito
    carregarConteudo('inicio');
});

// ==========================================
// NAVEGAÇÃO (ROUTER)
// ==========================================
async function carregarConteudo(tipo) {
    const conteudo = document.getElementById('conteudo-principal');
    const titulo = document.getElementById('titulo-seccao');

    // 1. PÁGINA INICIAL (CARDS)
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
    
    // 2. PÁGINA DE UTILIZADORES
    else if (tipo === 'utilizadores') {
        titulo.innerText = 'Gestão de Utilizadores';
        // Desenha a estrutura da tabela
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
        // Chama a API para preencher a tabela
        await preencherTabelaUtilizadores();
    }

    else if (tipo === 'cursos') {
        titulo.innerText = 'Gestão de Cursos';
        conteudo.innerHTML = '<div class="alert alert-warning">Funcionalidade de Cursos em construção...</div>';
    }
}

// ==========================================
// LÓGICA DE UTILIZADORES (API)
// ==========================================
async function preencherTabelaUtilizadores() {
    const token = localStorage.getItem('token');
    const tabela = document.getElementById('tabelaUsers');

    try {
        const res = await fetch(`${API_URL}/users`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const users = await res.json();
        
        tabela.innerHTML = ''; // Limpar o "A carregar..."

        users.forEach(user => {
            // Ícones
            let loginIcon = '<i class="fas fa-envelope text-secondary"></i>';
            if (user.googleId) loginIcon = '<i class="fab fa-google text-danger"></i>';
            else if (user.facebookId) loginIcon = '<i class="fab fa-facebook text-primary"></i>';

            // Estado
            const corBadge = user.conta_ativa ? 'success' : 'danger';
            const textoBadge = user.conta_ativa ? 'Ativo' : 'Inativo';
            
            // Dados para o modal (segurança de strings)
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
                            onclick="abrirModal(${user.id_user}, '${nomeSafe}', '${user.email}', ${roleId})">
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
        console.error(error);
        tabela.innerHTML = '<tr><td colspan="7" class="text-danger text-center">Erro ao carregar dados.</td></tr>';
    }
}

// ==========================================
// AÇÕES (EDITAR, ELIMINAR, ESTADO)
// ==========================================

function abrirModal(id, nome, email, roleId) {
    document.getElementById('editId').value = id;
    document.getElementById('editNome').value = nome;
    document.getElementById('editEmail').value = email;
    document.getElementById('editRole').value = roleId;

    const modal = new bootstrap.Modal(document.getElementById('modalEditarUser'));
    modal.show();
}

async function guardarEdicao() {
    const id = document.getElementById('editId').value;
    const nome = document.getElementById('editNome').value;
    const email = document.getElementById('editEmail').value;
    const roleId = document.getElementById('editRole').value;
    const token = localStorage.getItem('token');

    try {
        const res = await fetch(`${API_URL}/users/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token 
            },
            body: JSON.stringify({ nome, email, roleId })
        });

        if (res.ok) {
            alert('Guardado com sucesso!');
            
            // Fechar modal
            const modalEl = document.getElementById('modalEditarUser');
            const modal = bootstrap.Modal.getInstance(modalEl);
            modal.hide();

            // Atualizar tabela
            preencherTabelaUtilizadores();
        } else {
            alert('Erro ao guardar.');
        }
    } catch (error) {
        console.error(error);
    }
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

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}