const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
})

async function enviarEmail(destinatario, assunto, mensagem) {

    const info = await transporter.sendMail({
        from: `"Integra+" <${process.env.EMAIL_USER}>`,
        to: destinatario,
        subject: assunto,
        text: mensagem
    })

    return info
}

module.exports = enviarEmail