const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    
    // Configuração para o GMAIL
    const transporter = nodemailer.createTransport({
        service: 'gmail', // O Gmail tem um serviço pré-configurado
        auth: {
            user: process.env.EMAIL_USER, // Lê do ficheiro .env
            pass: process.env.EMAIL_PASS  // Lê do ficheiro .env
        }
    });

    // Opções do Email
    const mailOptions = {
        from: '"Portal ATEC" <no-reply@atec.pt>', // Nome que aparece
        to: options.email,
        subject: options.subject,
        html: options.html || options.message // Aceita HTML ou Texto
    };

    // Enviar
    await transporter.sendMail(mailOptions);
    console.log(`Email enviado para ${options.email}`);
};

module.exports = sendEmail;