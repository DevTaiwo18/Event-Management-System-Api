const nodemailer = require('nodemailer');

const notify = async ({username, email}) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false, 
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD 
        }
    });
    
    const mailOptions = {
        from: 'eventflow@demomailtrap.com',
        to: email,
        subject: 'Welcome',
        text: `Hi ${username} Welcome to our Service`
    };
    
    await transporter.sendMail(mailOptions);
}

module.exports = notify