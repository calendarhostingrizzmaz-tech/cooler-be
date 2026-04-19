import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    this.transporter = nodemailer.createTransport(this.buildSmtpOptions());
  }

  /** Nodemailer SMTP options from env — see `.env.example` in repo root. */
  private buildSmtpOptions(): SMTPTransport.Options {
    const host = this.config.get<string>('SMTP_HOST')?.trim();
    const port = parseInt(this.config.get<string>('SMTP_PORT') || '587', 10);
    const secureEnv = this.config.get<string>('SMTP_SECURE') === 'true';
    const secure = secureEnv || port === 465;
    const user = this.config.get<string>('SMTP_USER')?.trim();
    const pass = this.config.get<string>('SMTP_PASS') ?? '';

    if (!host) {
      this.logger.warn(
        'SMTP_HOST is not set — emails will fail until you configure SMTP in .env (see .env.example).',
      );
    }

    const options: SMTPTransport.Options = {
      host: host || '127.0.0.1',
      port,
      secure,
    };

    if (user) {
      options.auth = { user, pass };
    }

    if (this.config.get<string>('SMTP_TLS_REJECT_UNAUTHORIZED') === 'false') {
      options.tls = { rejectUnauthorized: false };
    }

    return options;
  }

  /** Verified sender address (many providers require this to match SMTP_USER). */
  private getFromAddress(): string {
    return (
      this.config.get<string>('SMTP_FROM')?.trim() ||
      this.config.get<string>('SMTP_USER')?.trim() ||
      'noreply@localhost'
    );
  }

  async sendCredentialUpdateEmail(
    to: string,
    changes: { field: string; newValue?: string }[],
  ): Promise<void> {
    const changesList = changes
      .map((c) => `• ${c.field}${c.newValue ? `: ${c.newValue}` : ' was updated'}`)
      .join('\n');

    const mailOptions = {
      from: `"Cooler Admin System" <${this.getFromAddress()}>`,
      to,
      subject: '🔐 Your Admin Credentials Were Updated',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1a1a2e; padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: #e94560; margin: 0;">Credentials Updated</h1>
          </div>
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hello Admin,</p>
            <p>The following changes were made to your account:</p>
            <pre style="background: #e9ecef; padding: 15px; border-radius: 5px;">${changesList}</pre>
            <p>If you did not make these changes, please contact the system owner immediately.</p>
            <p style="color: #666; font-size: 12px;">This is an automated notification from the Cooler Admin System.</p>
          </div>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Credential update email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
    }
  }

  async sendNewsletterWelcomeEmail(to: string): Promise<void> {
    const safeTo = to
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    const fromAddr = this.getFromAddress();
    const brandBlue = '#2563eb';
    const brandBlueDark = '#1d4ed8';
    const softBlue = '#dbeafe';
    const muted = '#64748b';

    const mailOptions = {
      from: `"National Industries" <${fromAddr}>`,
      to,
      subject: "Thanks for subscribing — you're on the list",
      html: `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background-color:#f1f5f9;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f1f5f9;padding:32px 16px;">
            <tr>
              <td align="center">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width:560px;background:${brandBlue};border-radius:28px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(37,99,235,0.35);">
                  <tr>
                    <td style="padding:40px 36px 28px 36px;text-align:center;">
                      <p style="margin:0 0 16px 0;font-family:Georgia,'Times New Roman',serif;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:${softBlue};">Official Store</p>
                      <h1 style="margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:28px;font-weight:900;line-height:1.2;color:#ffffff;">Thanks for subscribing</h1>
                      <p style="margin:16px 0 0 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:17px;line-height:1.55;color:${softBlue};">You're in — we'll email you about new cooling gear, launches, and subscriber-only offers.</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 36px 36px 36px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:20px;">
                        <tr>
                          <td style="padding:20px 22px;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#ffffff;">
                            <strong style="display:block;margin-bottom:8px;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:${softBlue};">Registered email</strong>
                            <span style="word-break:break-all;">${safeTo}</span>
                          </td>
                        </tr>
                      </table>
                      <p style="margin:24px 0 0 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:13px;line-height:1.5;color:${softBlue};text-align:center;">
                        Beat the heat with precision — explore our store anytime.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background:${brandBlueDark};padding:20px 36px;text-align:center;">
                      <p style="margin:0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:rgba(255,255,255,0.75);">National Industries · This is an automated message.</p>
                    </td>
                  </tr>
                </table>
                <p style="margin:20px 0 0 0;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:${muted};">If you didn't sign up, you can ignore this email.</p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Newsletter welcome email sent to ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send newsletter welcome email to ${to}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  /** Sends admin password-reset OTP to the configured recovery inbox (not the login email). */
  async sendAdminPasswordResetOtp(
    to: string,
    otp: string,
    adminLoginEmail: string,
  ): Promise<void> {
    const safeOtp = otp.replace(/[^\d]/g, '').slice(0, 6);
    const safeLogin = adminLoginEmail
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    const mailOptions = {
      from: `"Cooler Admin" <${this.getFromAddress()}>`,
      to,
      subject: 'Admin password reset — Cooler',
      html: `
        <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;">
          <p style="font-size:16px;color:#111;">A password reset was requested for the Cooler admin account:</p>
          <p style="font-size:14px;color:#444;word-break:break-all;"><strong>Login email:</strong> ${safeLogin}</p>
          <p style="font-size:14px;color:#444;">Use this one-time code in the admin panel (valid 15 minutes):</p>
          <div style="background:#f1f5f9;border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
            <span style="font-size:32px;font-weight:800;letter-spacing:0.35em;color:#1d4ed8;">${safeOtp}</span>
          </div>
          <p style="font-size:13px;color:#64748b;">If you did not request this, ignore this email. Your password will not change.</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Admin password reset OTP sent to ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send admin password reset email: ${(error as Error).message}`,
      );
      throw error;
    }
  }
}
