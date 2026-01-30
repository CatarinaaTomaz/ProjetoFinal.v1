document.addEventListener("DOMContentLoaded", () => {
    // 1. Verificar se já existe preferência guardada
    const currentTheme = localStorage.getItem('theme') || 'light';
    aplicarTema(currentTheme);

    // 2. Criar o Botão Flutuante (HTML via JS)
    const btn = document.createElement('button');
    btn.id = 'darkModeToggle';
    
    // Estilos Base (Bootstrap + Custom)
    btn.className = 'btn btn-dark rounded-circle shadow-sm d-flex align-items-center justify-content-center';
    
    // --- POSIÇÃO E TAMANHO (ALTERADO AQUI) ---
    btn.style.position = 'fixed';
    btn.style.top = '15px';       // Fica no TOPO
    btn.style.right = '15px';     // Fica na DIREITA
    btn.style.width = '32px';     // Mais PEQUENO (era 50px)
    btn.style.height = '32px';    // Mais PEQUENO (era 50px)
    btn.style.fontSize = '14px';  // Ícone mais pequeno
    btn.style.zIndex = '9999';    // Sempre por cima
    btn.style.border = '1px solid white';
    
    // Definir ícone inicial
    btn.innerHTML = currentTheme === 'dark' ? '☀️' : '🌙';
    
    // Adicionar ao corpo da página
    document.body.appendChild(btn);

    // 3. Ação ao Clicar
    btn.addEventListener('click', () => {
        const temaAtual = document.documentElement.getAttribute('data-bs-theme');
        const novoTema = temaAtual === 'dark' ? 'light' : 'dark';
        
        aplicarTema(novoTema);
        
        // Mudar o ícone
        btn.innerHTML = novoTema === 'dark' ? '☀️' : '🌙';
        
        // Mudar a cor do botão para contrastar (Preto no claro, Branco no escuro)
        if (novoTema === 'dark') {
            btn.className = 'btn btn-light rounded-circle shadow-sm d-flex align-items-center justify-content-center';
            btn.style.border = '1px solid #333';
        } else {
            btn.className = 'btn btn-dark rounded-circle shadow-sm d-flex align-items-center justify-content-center';
            btn.style.border = '1px solid white';
        }
    });
});

// Função que aplica o tema
function aplicarTema(tema) {
    document.documentElement.setAttribute('data-bs-theme', tema);
    localStorage.setItem('theme', tema);
}