# 🎓 ATEC - Sistema de Gestão Académica

> Uma plataforma web completa para gestão de academias, cursos, horários e formadores.

![Status do Projeto](https://img.shields.io/badge/Status-Concluído-success)
![Node.js](https://img.shields.io/badge/Backend-Node.js-green)
![MySQL](https://img.shields.io/badge/Database-MySQL-blue)

## 📖 Sobre o Projeto

Esta aplicação foi desenvolvida para modernizar a gestão escolar da ATEC. O sistema permite que administradores giram toda a estrutura letiva (cursos, salas, módulos), enquanto oferece aos formadores um portal dedicado para gerirem as suas disponibilidades e consultarem horários.

O destaque do projeto é o **Algoritmo de Agendamento Automático**, que utiliza a disponibilidade dos formadores para gerar horários de aulas automaticamente, evitando conflitos de salas e horários.

---

## ✨ Funcionalidades Principais

### 🔐 Segurança & Autenticação
* **Login Seguro:** Com encriptação de passwords.
* **Autenticação de 2 Fatores (2FA):** Envio de código OTP por email para maior segurança.
* **Controlo de Acesso (RBAC):** Perfis distintos para Admin, Formador, Secretaria e Formando.

### 🏢 Painel Administrativo (Dashboard)
* **Gestão de Utilizadores:** Criar, editar e exportar fichas de utilizadores (PDF).
* **Gestão Académica:** CRUD completo de Cursos, Módulos e Salas.
* **Agendamento Inteligente:**
    * Validação de conflitos de Sala/Hora em tempo real.
    * Controlo de carga horária dos módulos.
* **🤖 Gerador Automático de Horários:** Algoritmo que aloca aulas automaticamente baseando-se na disponibilidade do formador e na duração do módulo.

### 👨‍🏫 Portal do Formador
* **Meus Módulos:** Visualização dos módulos atribuídos.
* **Gestão de Disponibilidade:** Calendário interativo para definir horários livres.
* **Consulta de Horário:** Visualização das aulas agendadas.
* **Perfil:** Edição de dados e foto de perfil.

### 💬 Extras
* **Chatbot:** Assistente virtual integrado.
* **Relatórios:** Exportação de dados em PDF.

---

## 🛠️ Stack Tecnológica

* **Backend:** Node.js, Express.js
* **Base de Dados:** MySQL, Sequelize ORM
* **Frontend:** HTML5, CSS3, JavaScript (Vanilla), Bootstrap 5
* **Ferramentas:** FullCalendar, html2pdf.js, JWT, Nodemailer

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
* [Node.js](https://nodejs.org/) instalado.
* [MySQL](https://www.mysql.com/) instalado e a correr.

### 1. Clonar o Repositório
```bash
git clone [https://github.com/teu-utilizador/nome-do-repo.git](https://github.com/teu-utilizador/nome-do-repo.git)
cd nome-do-repo
```

### Configurar Variáveis de Ambiente (.env)
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASS=tua_password_mysql
DB_NAME=atec_db
JWT_SECRET=segredo_super_secreto
EMAIL_USER=teu_email_para_2fa@gmail.com
EMAIL_PASS=tua_password_de_aplicacao


### Instalar Dependências e Correr
```bash
cd backend
npm install
#iniciar o servidor
node server.js
```

### Estrutura do Projeto
/
├── backend/
│   ├── controllers/   # Lógica das funcionalidades
│   ├── models/        # Definição das tabelas (Sequelize)
│   ├── routes/        # Rotas da API
│   ├── middleware/    # Segurança (Auth)
│   └── server.js      # Ponto de entrada
│
├── frontend/
│   ├── css/           # Estilos
│   ├── js/            # Lógica do Frontend
│   └── *.html         # Páginas (Login, Dashboard, Portais)
│
└── README.md



### 👤 Autores
Catarina Tomaz & Diogo Simões
