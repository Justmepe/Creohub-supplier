# Gmail SMTP Setup for Email Verification

The platform now uses Gmail SMTP exclusively for sending verification emails.

## Setup Instructions for Production VPS

### 1. Create Gmail App Password
1. Go to your Gmail account settings
2. Enable 2-Factor Authentication (required for app passwords)
3. Go to Security → 2-Step Verification → App Passwords
4. Generate an app password for "Mail"
5. Copy the 16-character password (remove spaces)

### 2. Environment Variables for VPS
Add these to your production environment:

```bash
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
```

### 3. Alternative Email Services
If you prefer other options:

**Mailgun** (Developer friendly)
- Free tier: 100 emails/day
- Easy setup, good for developers

**Brevo (formerly Sendinblue)** (More lenient than SendGrid)
- Free tier: 300 emails/day
- Less strict approval process

**Amazon SES** (If you have AWS)
- Very cost-effective
- Requires AWS account

## Current Status
- ✅ Gmail SMTP integration ready
- ✅ Fallback to console logging for development
- ✅ Email verification system fully functional
- ✅ Ready for production deployment

## Testing
The system currently works with console-logged codes for development. Once you add Gmail credentials to your VPS, real emails will be sent automatically.