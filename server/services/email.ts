import { MailService } from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  console.warn("SENDGRID_API_KEY not found. Email functionality will be disabled.");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.log("Email would be sent:", params);
    return true; // Return true in development when no API key is set
  }

  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text || '',
      html: params.html || params.text || '',
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationEmail(email: string, code: string, type: string): Promise<boolean> {
  const subject = type === 'registration' 
    ? 'Verify your Creohub account' 
    : type === 'password_reset' 
    ? 'Reset your password' 
    : 'Verify your email change';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f97316;">Creohub Email Verification</h2>
      <p>Hello,</p>
      <p>Your verification code is:</p>
      <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
        <span style="font-size: 32px; font-weight: bold; color: #f97316; letter-spacing: 4px;">${code}</span>
      </div>
      <p>This code will expire in 10 minutes.</p>
      <p>If you didn't request this verification, you can safely ignore this email.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px;">
        Best regards,<br>
        The Creohub Team
      </p>
    </div>
  `;

  const text = `
Creohub Email Verification

Your verification code is: ${code}

This code will expire in 10 minutes.

If you didn't request this verification, you can safely ignore this email.

Best regards,
The Creohub Team
  `;

  return await sendEmail({
    to: email,
    from: 'noreply@creohub.com',
    subject,
    text,
    html
  });
}