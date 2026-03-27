import { Resend } from 'resend';

export async function sendEmail(
  apiKey: string,
  to: string,
  subject: string,
  html: string
) {
  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: 'ProspectAI <onboarding@resend.dev>', // Should be a verified domain in prod
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('Resend Error:', error);
      throw new Error(error.message);
    }

    return data;
  } catch (error: any) {
    console.error('Email Service Error:', error.message);
    throw new Error('Erro ao enviar e-mail');
  }
}
