import { Resend } from 'resend';
import dotenv from 'dotenv';


dotenv.config();

const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  throw new Error('Missing RESEND_API_KEY environment variable');
}

const resend = new Resend(resendApiKey);

export default async function sendOtp( email: string,otp:string,ttlmin:Number) {
  // Fix 1: Actually call the function to get the generated OTP


  try {
    const { data, error } = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>',
      to: [email.trim()],
      subject: ` here is your verification code .Expires in ${ttlmin} minutes`,
      html: `<strong>Your OTP: ${otp}</strong>`,
    });

    if (error) {
      console.error("Resend API Error:", error);
      return false; // Return false so the controller knows it failed
    }

    console.log("Email sent successfully:", data);

    // You should probably return the OTP here so your controller
    // can save it to the database for later verification!
    return true;

  } catch (err) {
    console.error("Unexpected error sending email:", err);
    return false;
  }
}