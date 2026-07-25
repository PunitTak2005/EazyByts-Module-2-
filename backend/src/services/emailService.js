import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = null;
    this.isVerified = false;
    this.initTransporter();
  }

  initTransporter() {
    if (process.env.NODE_ENV === 'test') {
      this.transporter = null;
      this.isVerified = false;
      return;
    }

    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.SMTP_PORT, 10) || 587;
    const user = (process.env.SMTP_USER || '').trim();
    const rawPass = (process.env.SMTP_PASS || '').trim();
    // Strip spaces from app passwords (e.g. "eqdp fzde pkqe hvzn" -> "eqdpfzdepkqehvzn")
    const pass = rawPass.replace(/\s+/g, '');
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (host && user && pass) {
      console.log('✓ SMTP configuration loaded');

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      // Startup verification
      this.transporter.verify((error) => {
        if (error) {
          this.isVerified = false;
          console.error(`❌ SMTP connection verification failed for [${host}:${port}]:`, error.message);
        } else {
          this.isVerified = true;
          console.log(`✓ SMTP connection verified (${user} via ${host}:${port})`);
        }
      });
    } else {
      console.warn('⚠️ SMTP configuration incomplete (SMTP_USER or SMTP_PASS missing).');
      this.transporter = null;
      this.isVerified = false;
    }
  }

  /**
   * Generic email send function
   * @param {Object} options { to, subject, html, text }
   * @returns {Promise<Object>} { success: boolean, messageId?: string, error?: string }
   */
  async sendEmail({ to, subject, html, text }) {
    if (!this.transporter && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.initTransporter();
    }

    const fromName = process.env.FROM_NAME || 'Stock Market Dashboard';
    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@stockdashboard.com';
    const from = `"${fromName}" <${fromEmail}>`;

    if (this.transporter) {
      try {
        console.log(`[EmailService] Attempting to send email to ${to}...`);
        const info = await this.transporter.sendMail({
          from,
          to,
          subject,
          text,
          html,
        });
        console.log(`✉️ Email sent successfully to ${to}. MessageId: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (err) {
        console.error(`❌ Backend Email Delivery Failed for ${to}:`, err.message || err);
        return { success: false, error: err.message };
      }
    }

    console.warn(`⚠️ SMTP transport not configured. Email to ${to} could not be sent.`);
    return { success: false, error: 'SMTP server is not active' };
  }

  /**
   * Send Password Reset Email with Token & Reset Link
   * @param {Object} data { email, name, resetToken, resetUrl }
   * @returns {Promise<Object>} { success: boolean, messageId?: string, error?: string }
   */
  async sendPasswordResetEmail({ email, name, resetToken, resetUrl }) {
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:3250';
    const url = resetUrl || `${appUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    const userName = name || 'Trader';

    const subject = '🔐 Password Reset Request - Stock Market Dashboard';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Password Reset Request</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
    .container { max-width: 560px; margin: 0 auto; background: #1e293b; border-radius: 12px; border: 1px solid #334155; padding: 32px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    .logo { text-align: center; margin-bottom: 24px; font-size: 24px; font-weight: bold; color: #38bdf8; }
    h2 { color: #f8fafc; font-size: 20px; margin-top: 0; }
    p { color: #94a3b8; font-size: 15px; line-height: 1.6; }
    .btn-container { text-align: center; margin: 28px 0; }
    .btn { background: linear-gradient(135deg, #0284c7, #2563eb); color: #ffffff !important; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(37,99,235,0.3); }
    .token-box { background: #0f172a; border: 1px dashed #475569; padding: 12px; border-radius: 8px; font-family: monospace; font-size: 16px; color: #38bdf8; text-align: center; margin: 16px 0; word-break: break-all; }
    .footer { margin-top: 32px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #334155; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">📈 Stock Market Dashboard</div>
    <h2>Password Reset Request</h2>
    <p>Hello ${userName},</p>
    <p>We received a request to reset your password for your Stock Market Dashboard account. Click the button below to reset your password:</p>
    
    <div class="btn-container">
      <a href="${url}" class="btn" target="_blank">Reset Password</a>
    </div>

    <p>Or use your verification token directly on the reset password screen:</p>
    <div class="token-box">${resetToken}</div>

    <p>This password reset token is valid for <strong>1 hour</strong>. If you did not request a password reset, please ignore this email.</p>
    
    <div class="footer">
      Sent by Stock Market Dashboard Simulation Platform.<br/>
      If you need assistance, please contact system administrator.
    </div>
  </div>
</body>
</html>
`;

    const text = `Hello ${userName},\n\nWe received a request to reset your password for your Stock Market Dashboard account.\n\nReset Link: ${url}\nVerification Token: ${resetToken}\n\nThis token will expire in 1 hour.\nIf you did not request this, please ignore this email.`;

    return await this.sendEmail({ to: email, subject, html, text });
  }

  /**
   * Send Password Reset Confirmation Email after successful reset
   * @param {Object} data { email, name }
   * @returns {Promise<Object>} { success: boolean, messageId?: string, error?: string }
   */
  async sendPasswordResetConfirmationEmail({ email, name }) {
    const userName = name || 'Trader';
    const subject = '✅ Password Successfully Reset - Stock Market Dashboard';
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Password Reset Successful</title>
</head>
<body style="font-family: sans-serif; background-color: #0f172a; color: #f8fafc; padding: 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #1e293b; padding: 32px; border-radius: 12px;">
    <h2 style="color: #38bdf8;">Password Updated Successfully</h2>
    <p>Hello ${userName},</p>
    <p>Your password for Stock Market Dashboard has been successfully reset. You can now log in with your new password.</p>
    <p>If you did not perform this change, please contact support immediately.</p>
  </div>
</body>
</html>
`;
    const text = `Hello ${userName},\n\nYour password for Stock Market Dashboard has been successfully reset.\nIf you did not perform this change, please contact support immediately.`;
    return await this.sendEmail({ to: email, subject, html, text });
  }
}

export const emailService = new EmailService();
export default emailService;
