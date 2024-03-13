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
        text:  `Hi ${username}, welcome to our service! We're thrilled to have you join us. Now that you're here, take some time to explore and create your own events. Dive into a world of opportunities where you can connect, learn, and grow. Let's make something amazing together!`
    };
    
    await transporter.sendMail(mailOptions);
}

module.exports = notify