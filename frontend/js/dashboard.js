const API_URL = 'http://localhost:3000/api';

// 1. Verificar Segurança ao Carregar a Página
document.addEventListener("DOMContentLoaded", () => {
    // --- LÓGICA GOOGLE (Novo) ---
    const params = new URLSearchParams(window.location.search);
    const tokenUrl = params.get('token');
    const userUrl = params.get('user');

    if (tokenUrl && userUrl) {
        // Se viemos do Google, guardamos tudo e limpamos a URL
        localStorage.setItem('token', tokenUrl);
        localStorage.setItem('user', decodeURIComponent(userUrl));
        
        // Limpar a URL para ficar bonita
        window.history.replaceState({}, document.title, "dashboard.html");
    }

    // --- 2. VERIFICAÇÃO DE SEGURANÇA E ROLE ---
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        window.location.href = 'login.html';
        return;
    }

    const user = JSON.parse(userStr);

    // [NOVO] Se NÃO for Admin, manda para o Portal do Aluno
    if (user.role !== 'Admin') {
        console.log("Aluno detetado no Dashboard. Redirecionando...");
        window.location.href = 'portal-aluno.html';
        return; // Para a execução aqui
    }
    
    // Configurar o botão de esconder menu
    const el = document.getElementById("wrapper");
    const toggleButton = document.getElementById("menu-toggle");
    toggleButton.onclick = function () {
        el.classList.toggle("toggled");
    };
});

// 2. Função de Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// 3. Função Genérica para ir buscar dados à API (Fetch)
async function fetchAPI(endpoint) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/${endpoint}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // Envia o token no cabeçalho
                'Content-Type': 'application/json'
            }
        });
        if (response.status === 401 || response.status === 403) {
            logout(); // Se o token expirou, logout
        }
        return await response.json();
    } catch (error) {
        console.error("Erro na API:", error);
        return null;
    }
}

// 4. Gestor de Conteúdos (O "Router" simples)
async function carregarConteudo(tipo) {
    const titulo = document.getElementById('titulo-seccao');
    const conteudo = document.getElementById('conteudo-principal');
    
    // Limpar conteudo atual
    conteudo.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"></div></div>';

    if (tipo === 'inicio') {
        titulo.innerText = 'Visão Geral';
        conteudo.innerHTML = `
            <div class="alert alert-info">Bem-vindo ao BackOffice da ATEC! Seleciona uma opção no menu.</div>
        `;
    } 
    
    else if (tipo === 'cursos') {
        titulo.innerText = 'Gestão de Cursos';
        // AQUI CHAMAMOS A API (Isto só vai funcionar quando criares a rota no backend!)
        const cursos = await fetchAPI('cursos'); 
        
        if (!cursos || cursos.length === 0) {
            conteudo.innerHTML = '<p>Não há cursos registados.</p>';
            return;
        }

        // Desenhar Tabela HTML
        let html = `
            <button class="btn btn-success mb-3">+ Novo Curso</button>
            <table class="table table-striped bg-white rounded shadow-sm">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>Área</th>
                        <th>Início</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Loop pelos dados
        cursos.forEach(curso => {
            html += `
                <tr>
                    <td>${curso.id_curso}</td>
                    <td>${curso.nome}</td>
                    <td>${curso.area}</td>
                    <td>${curso.data_inicio}</td>
                    <td>
                        <button class="btn btn-sm btn-primary"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        conteudo.innerHTML = html;
    } 
    
    else if (tipo === 'utilizadores') {
        titulo.innerText = 'Gestão de Utilizadores';
        // Nota: Precisas de criar a rota /api/users no backend para isto funcionar
        const users = await fetchAPI('users'); 

        let html = `<table class="table bg-white shadow-sm"><thead><tr><th>Nome</th><th>Email</th><th>Role</th></tr></thead><tbody>`;
        if(users) {
            users.forEach(u => {
                html += `<tr><td>${u.nome_completo}</td><td>${u.email}</td><td>${u.Role ? u.Role.descricao : 'N/A'}</td></tr>`;
            });
        }
        html += `</tbody></table>`;
        conteudo.innerHTML = html;
    }
}