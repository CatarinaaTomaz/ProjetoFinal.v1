// frontend/js/chat.js

console.log("💬 Chatbot a iniciar...");

// 1. Definir API_URL de forma segura (sem conflitos com const/var)
// Se o portal.js já definiu, usamos esse. Se não, definimos nós.
if (typeof API_URL === 'undefined') {
    window.API_URL = 'http://localhost:3000/api';
}

function toggleChat() {
    const w = document.getElementById('chatWindow');
    if (!w) return console.error("Janela do chat não encontrada!");
    
    if (w.style.display === 'flex') {
        w.style.display = 'none';
    } else {
        w.style.display = 'flex';
        // Tenta focar no input
        setTimeout(() => {
            const input = document.getElementById('chatInput');
            if(input) input.focus();
        }, 100);
    }
}

async function enviarMensagem() {
    const input = document.getElementById('chatInput');
    const texto = input.value.trim();
    const chatBody = document.getElementById('chatBody');

    if (!texto) return;

    // 1. Mostrar mensagem do utilizador
    chatBody.innerHTML += `<div class="msg msg-user">${texto}</div>`;
    input.value = '';
    chatBody.scrollTop = chatBody.scrollHeight;

    // 2. Loading
    const loadingId = 'loading-' + Date.now();
    chatBody.innerHTML += `<div class="msg msg-bot" id="${loadingId}"><i class="fas fa-ellipsis-h"></i></div>`;
    chatBody.scrollTop = chatBody.scrollHeight;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${window.API_URL}/chat`, { // Usamos window.API_URL
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token 
            },
            body: JSON.stringify({ mensagem: texto })
        });

        const data = await res.json();

        // Remover loading e mostrar resposta
        const loadingEl = document.getElementById(loadingId);
        if(loadingEl) loadingEl.remove();
        
        chatBody.innerHTML += `<div class="msg msg-bot">${data.reply}</div>`;
        
    } catch (e) {
        console.error("Erro no chat:", e);
        const loadingEl = document.getElementById(loadingId);
        if(loadingEl) loadingEl.remove();
        
        chatBody.innerHTML += `<div class="msg msg-bot text-danger">Erro de conexão.</div>`;
    }

    chatBody.scrollTop = chatBody.scrollHeight;
}