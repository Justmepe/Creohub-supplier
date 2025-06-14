import * as nodemailer from 'nodemailer';

// Initialize Gmail SMTP service
let gmailTransporter: any = null;
let isEmailConfigured = false;

// Use the Gmail user from .env and app password from secrets
const gmailUser = process.env.GMAIL_USER || 'petersongikonyo182@gmail.com';
const gmailPassword = process.env.GMAIL_APP_PASSWORD;

if (gmailUser && gmailPassword) {
  // Use the app password exactly as provided
  const appPassword = gmailPassword.trim();
  
  console.log('Configuring Gmail with user:', gmailUser);
  console.log('Password length:', appPassword.length);
  console.log('Password preview:', appPassword.substring(0, 4) + '****' + appPassword.substring(appPassword.length - 4));
  
  gmailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: appPassword
    },
    secure: true,
    port: 465,
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
    console.log(`Email sent successfully to ${params.to}`);
    return true;
  } catch (error) {
    console.error('Gmail email error:', error);
    // Fallback: Log verification code to console for development
    console.log('=== EMAIL FALLBACK ===');
    console.log(`To: ${params.to}`);
    console.log(`Subject: ${params.subject}`);
    console.log(`Content: ${params.text || params.html}`);
    console.log('======================');
    return true; // Return true to continue the flow
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