require('dotenv').config();
const nodemailer = require('nodemailer');

async function testMail() {
  const email = process.env.SMTP_EMAIL;
  const pass = process.env.SMTP_PASSWORD;
  
  console.log('User:', email);
  console.log('Pass length:', pass.length);
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: email,
      pass: pass,
    },
    // Adding host and port explicitly might help bypass IPv6 hangs
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, 
    connectionTimeout: 10000,
  });

  try {
    const info = await transporter.sendMail({
      from: email,
      to: email, // send to self
      subject: 'Test email from Hotel App',
      text: 'This is a test email.'
    });
    console.log('Message sent:', info.messageId);
  } catch (error) {
    console.error('Error sending mail:', error);
  }
}

testMail();
