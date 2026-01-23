// backend/controllers/chatController.js

exports.processarMensagem = async (req, res) => {
    try {
        const { mensagem } = req.body;
        const msg = mensagem.toLowerCase();
        let resposta = "";

        // Lógica simples de palavras-chave
        if (msg.includes('olá') || msg.includes('ola') || msg.includes('bom dia')) {
            resposta = "Olá! Sou o assistente virtual da ATEC. Como posso ajudar?";
        } 
        else if (msg.includes('curso') || msg.includes('inscrever')) {
            resposta = "Temos cursos de TPSI e Cibersegurança. Podes ver tudo no menu 'Gestão de Cursos'.";
        }
        else if (msg.includes('preço') || msg.includes('custo') || msg.includes('pagar')) {
            resposta = "Os nossos cursos são financiados! Não têm custo para o formando.";
        }
        else if (msg.includes('horário') || msg.includes('horas')) {
            resposta = "Podes consultar o teu horário no menu 'Mapa de Aulas'.";
        }
        else if (msg.includes('ajuda') || msg.includes('admin')) {
            resposta = "Para problemas técnicos, contacta o administrador: admin@atec.pt";
        }
        else {
            resposta = "Desculpa, ainda estou a aprender. Podes tentar reformular a pergunta?";
        }

        // Simular um pequeno atraso para parecer que está a "pensar"
        setTimeout(() => {
            res.json({ reply: resposta });
        }, 500);

    } catch (error) {
        console.error(error);
        res.status(500).json({ reply: "Estou com dores de cabeça (Erro no servidor)." });
    }
};