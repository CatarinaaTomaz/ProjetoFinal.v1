const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // 1. Ler o cabeçalho
    const tokenHeader = req.header('Authorization');

    // LOG DO ESPIÃO 🕵️‍♂️
    console.log("--- DIAGNÓSTICO AUTH ---");
    console.log("1. Cabeçalho Recebido:", tokenHeader);

    if (!tokenHeader) {
        return res.status(401).json({ msg: "Sem token, autorização negada" });
    }

    try {
        // 2. Limpar a palavra 'Bearer ' (se existir)
        // Se o teu token vier como "Bearer eyJhb...", ficamos só com "eyJhb..."
        const token = tokenHeader.replace('Bearer ', '');
        
        console.log("2. Token Limpo:", token.substring(0, 20) + "..."); // Mostra só o início
        console.log("3. Segredo usado:", process.env.JWT_SECRET); // CONFIRMA SE ISTO APARECE!

        // 3. Verificar
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        
        console.log("✅ Token Válido para User ID:", decoded.id);
        next();

    } catch (err) {
        console.log("❌ ERRO VERIFICAÇÃO:", err.message);
        res.status(401).json({ msg: "Token não é válido", erro: err.message });
    }
};