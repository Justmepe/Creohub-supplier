import * as nodemailer from 'nodemailer';

// Initialize Gmail SMTP service
let gmailTransporter: any = null;
let isEmailConfigured = false;

if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  // Remove any spaces from app password
  const cleanPassword = process.env.GMAIL_APP_PASSWORD.replace(/\s/g, '');
  
  gmailTransporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: cleanPassword
    },
    tls: {
      rejectUnauthorized: false
    }
  });
  isEmailConfigured = true;
  console.log('Email configured with Gmail SMTP');
} else {
  console.warn("Gmail not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD for email functionality.");
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  // No email service configured - log to console for development
  if (!isEmailConfigured) {
    console.log("Email would be sent:", params);
    return true;
  }

  try {
    await gmailTransporter.sendMail({
      from: params.from,
      to: params.to,
      subject: params.subject,
      text: params.text || '',
      html: params.html || params.text || '',
    });
    return true;
  } catch (error) {
    console.error('Gmail email error:', error);
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