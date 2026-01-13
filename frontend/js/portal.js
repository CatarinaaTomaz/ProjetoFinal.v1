const API_URL = 'http://localhost:3000/api';
const BASE_URL = 'http://localhost:3000'; // URL para carregar as imagens

document.addEventListener("DOMContentLoaded", () => {
    // 1. Verificar se existe Token e Sessão
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Preencher os dados na página
    try {
        const user = JSON.parse(userStr);

        // Preencher textos (Nome, Email, Role, ID)
        // Usamos || para garantir que funciona com diferentes formatos de objeto
        document.getElementById('nomeAluno').textContent = user.nome || user.nome_completo || 'Utilizador';
        
        // Se tiveres elementos com estes IDs no HTML, preenche-os:
        if(document.getElementById('userEmail')) document.getElementById('userEmail').textContent = user.email;
        if(document.getElementById('userRole')) document.getElementById('userRole').textContent = user.role || 'Formando';
        if(document.getElementById('userId')) document.getElementById('userId').textContent = user.id || user.id_user;
        if(document.getElementById('cursoAluno')) document.getElementById('cursoAluno').textContent = user.role || 'Formando';

        // 3. CARREGAR FOTO DE PERFIL EXISTENTE
        // Se o user já tiver uma foto salva no localStorage (ou vinda do login), mostramos
        if (user.foto) {
            // A foto vem como "uploads/imagem.jpg", temos de juntar ao localhost
            document.getElementById('imgPerfil').src = `${BASE_URL}/${user.foto}`;
        } else {
            // Se for login social (Google/Facebook) e tiver foto externa
            // (Esta lógica é opcional, depende se guardaste a foto do Google)
            if(user.picture) { 
                 document.getElementById('imgPerfil').src = user.picture;
            }
        }

    } catch (e) {
        console.error("Erro ao ler dados do utilizador", e);
        logout(); // Se os dados estiverem corrompidos, força logout
    }
});

// ==========================================
// FUNÇÕES GLOBAIS (Acessíveis pelo HTML)
// ==========================================

async function uploadFoto() {
    const input = document.getElementById('inputFoto');
    const file = input.files[0];
    
    if (!file) return;

    // Obter dados frescos
    const userStr = localStorage.getItem('user');
    const user = JSON.parse(userStr);
    const token = localStorage.getItem('token');
    
    // Garantir que temos o ID correto
    const userId = user.id || user.id_user;

    // Preparar o envio (FormData)
    const formData = new FormData();
    formData.append('foto', file);

    try {
        // Feedback visual (imagem fica transparente enquanto carrega)
        const imgElement = document.getElementById('imgPerfil');
        imgElement.style.opacity = '0.5';

        const res = await fetch(`${API_URL}/users/${userId}/foto`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token
                // Nota: O browser define o Content-Type automaticamente para FormData
            },
            body: formData
        });

        const data = await res.json();

        if (res.ok) {
            // 1. Atualizar a imagem na página
            // O timestamp (?t=...) obriga o browser a não usar a cache antiga
            const novaFotoUrl = `${BASE_URL}/${data.foto}`;
            imgElement.src = novaFotoUrl + '?t=' + new Date().getTime();
            
            // 2. Atualizar o localStorage para a próxima vez que entrares a foto já lá estar
            user.foto = data.foto;
            localStorage.setItem('user', JSON.stringify(user));

            alert('Foto atualizada com sucesso!');
        } else {
            alert('Erro: ' + data.msg);
        }

    } catch (error) {
        console.error(error);
        alert('Erro ao enviar foto. Verifica se o servidor está ligado.');
    } finally {
        // Restaurar opacidade
        document.getElementById('imgPerfil').style.opacity = '1';
    }
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}