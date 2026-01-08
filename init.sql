USE auth_db;

-- 1. Tabela de Utilizadores
CREATE TABLE IF NOT EXISTS utilizadores (
    id_utilizador INT AUTO_INCREMENT PRIMARY KEY,
    nome_completo VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    telefone VARCHAR(20),
    foto_url VARCHAR(255),
    
    -- Estados
    conta_ativa BOOLEAN DEFAULT FALSE,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ultimo_login DATETIME,
    
    -- 2FA
    dois_fatores_ativado BOOLEAN DEFAULT FALSE,
    dois_fatores_segredo VARCHAR(100),
    
    -- OAuth
    google_id VARCHAR(255) UNIQUE,
    facebook_id VARCHAR(255) UNIQUE
);

-- 2. Tabela de Tokens (Ativação/Recuperação)
CREATE TABLE IF NOT EXISTS tokens_verificacao (
    id_token INT AUTO_INCREMENT PRIMARY KEY,
    id_utilizador INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    tipo_token ENUM('ATIVACAO', 'RECUPERACAO') NOT NULL,
    data_expiracao DATETIME NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_utilizador) REFERENCES utilizadores(id_utilizador) ON DELETE CASCADE
);

-- 3. Logs de Acesso
CREATE TABLE IF NOT EXISTS logs_acesso (
    id_log INT AUTO_INCREMENT PRIMARY KEY,
    id_utilizador INT,
    evento VARCHAR(50),
    ip_origem VARCHAR(45),
    data_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_utilizador) REFERENCES utilizadores(id_utilizador) ON DELETE SET NULL
);