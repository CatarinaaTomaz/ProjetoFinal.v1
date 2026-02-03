const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // 1. Ler o token do cabeçalho
    const tokenHeader = req.header('Authorization');

    // 2. Verificar se existe token
    if (!tokenHeader) {
        return res.status(401).json({ msg: 'Sem token, autorização negada' });
    }

    try {
        // 3. Limpar o prefixo "Bearer " se ele existir
        // (Alguns frontends enviam "Bearer <token>", outros só o token)
        const token = tokenHeader.replace('Bearer ', '');

        // 4. Decifrar o token
        // Usa a mesma chave secreta que definiste no .env ou usa 'secret' como fallback
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

        // 5. Adicionar o utilizador ao pedido (req)
        req.user = decoded.user;
        
        // 6. Passar para a próxima função (o controller)
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token não é válido' });
    }
};