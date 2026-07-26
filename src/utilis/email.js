import { Resend } from 'resend';
import dotenv from 'dotenv'

dotenv.config();

const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  throw new Error('Missing RESEND_API_KEY environment variable');
}

const resend = new Resend(resendApiKey);

export default async function sendOtp(otp, username) {
  const { data, error } = await resend.emails.send({
    from: 'Acme <onboarding@resend.dev>',
    to: ['yamitniranjan@gmail.com'],
    subject: `Hello ${username}`,
    html: `<strong>Your OTP: ${otp}</strong>`,
  });

  if (error) {
    return console.error({ error });
  }

  console.log({ data });
}