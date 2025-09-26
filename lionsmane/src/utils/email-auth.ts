import nodemailer from 'nodemailer';

export async function sendAuthEmail(
  email: string,
  subject: string,
  payload: string,
) {
  if (
    !process.env.FROM_ADDR ||
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    throw new Error('Missing required env variables for SMTP');
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    secure: false, // upgrade later with STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.FROM_ADDR,
      to: email,
      subject: subject,
      text: payload,
    });
    console.log(`Message sent: ${info.messageId}`);
  } catch (error) {
    console.error('Error sending mail for auth', error);
    throw new Error('Error sending mail for auth', { cause: error });
  }
}
