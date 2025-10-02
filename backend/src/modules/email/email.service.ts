import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private readonly appName: string;
  private readonly frontendUrl: string;

  constructor(private configService: ConfigService) {
    this.appName = this.configService.get<string>('APP_NAME') || 'Nolojia Wallet';
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      const host = this.configService.get<string>('SMTP_HOST');
      const port = this.configService.get<number>('SMTP_PORT') || 587;
      const secure = this.configService.get<boolean>('SMTP_SECURE') || false;
      const user = this.configService.get<string>('SMTP_USER');
      const pass = this.configService.get<string>('SMTP_PASS');

      if (!host || !user || !pass) {
        this.logger.warn('SMTP credentials not configured. Email service will not work.');
        return;
      }

      this.transporter = nodemailer.createTransporter({
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

      this.logger.log('Email service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize email service', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    if (!this.transporter) {
      this.logger.error('Email service not initialized');
      return {
        success: false,
        error: 'Email service not configured',
      };
    }

    try {
      const defaultFrom = this.configService.get<string>('SMTP_FROM') ||
                         `${this.appName} <noreply@nolojia.com>`;

      const mailOptions = {
        from: options.from || defaultFrom,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Email sent successfully to ${mailOptions.to}`);

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      this.logger.error('Failed to send email', error);
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }
  }

  async sendVerificationEmail(
    email: string,
    firstName: string,
    verificationToken: string,
  ): Promise<EmailResponse> {
    const verificationLink = `${this.frontendUrl}/verify-email?token=${verificationToken}`;

    const html = this.getVerificationEmailTemplate(firstName, verificationLink);
    const text = this.getVerificationEmailText(firstName, verificationLink);

    return this.sendEmail({
      to: email,
      subject: `Welcome to ${this.appName} - Verify Your Email`,
      html,
      text,
    });
  }

  async sendPasswordResetEmail(
    email: string,
    firstName: string,
    resetToken: string,
  ): Promise<EmailResponse> {
    const resetLink = `${this.frontendUrl}/reset-password?token=${resetToken}`;

    const html = this.getPasswordResetEmailTemplate(firstName, resetLink);
    const text = this.getPasswordResetEmailText(firstName, resetLink);

    return this.sendEmail({
      to: email,
      subject: `${this.appName} - Password Reset Request`,
      html,
      text,
    });
  }

  async sendWelcomeEmail(
    email: string,
    firstName: string,
  ): Promise<EmailResponse> {
    const html = this.getWelcomeEmailTemplate(firstName);
    const text = this.getWelcomeEmailText(firstName);

    return this.sendEmail({
      to: email,
      subject: `Welcome to ${this.appName}!`,
      html,
      text,
    });
  }

  async sendPasswordChangedEmail(
    email: string,
    firstName: string,
  ): Promise<EmailResponse> {
    const html = this.getPasswordChangedEmailTemplate(firstName);
    const text = this.getPasswordChangedEmailText(firstName);

    return this.sendEmail({
      to: email,
      subject: `${this.appName} - Password Changed Successfully`,
      html,
      text,
    });
  }

  private getVerificationEmailTemplate(firstName: string, verificationLink: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email - ${this.appName}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${this.appName}</h1>
            </div>
            <div class="content">
                <h2>Welcome, ${firstName}!</h2>
                <p>Thank you for signing up for ${this.appName}. To complete your registration and activate your account, please verify your email address by clicking the button below:</p>

                <div style="text-align: center;">
                    <a href="${verificationLink}" class="button">Verify Email Address</a>
                </div>

                <p>If the button above doesn't work, you can copy and paste the following link into your browser:</p>
                <p style="background: #e5e7eb; padding: 10px; border-radius: 4px; word-break: break-all;">
                    <a href="${verificationLink}">${verificationLink}</a>
                </p>

                <p><strong>This verification link will expire in 24 hours.</strong></p>

                <p>If you didn't create an account with ${this.appName}, please ignore this email.</p>

                <p>Best regards,<br>The ${this.appName} Team</p>
            </div>
            <div class="footer">
                <p>© 2023 ${this.appName}. All rights reserved.</p>
                <p>This is an automated email. Please do not reply to this message.</p>
            </div>
        </div>
    </body>
    </html>`;
  }

  private getVerificationEmailText(firstName: string, verificationLink: string): string {
    return `
Welcome to ${this.appName}, ${firstName}!

Thank you for signing up. To complete your registration and activate your account, please verify your email address by visiting the following link:

${verificationLink}

This verification link will expire in 24 hours.

If you didn't create an account with ${this.appName}, please ignore this email.

Best regards,
The ${this.appName} Team

This is an automated email. Please do not reply to this message.
    `.trim();
  }

  private getPasswordResetEmailTemplate(firstName: string, resetLink: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - ${this.appName}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${this.appName}</h1>
                <h2>Password Reset Request</h2>
            </div>
            <div class="content">
                <h2>Hello, ${firstName}</h2>
                <p>We received a request to reset the password for your ${this.appName} account.</p>

                <div style="text-align: center;">
                    <a href="${resetLink}" class="button">Reset Password</a>
                </div>

                <p>If the button above doesn't work, you can copy and paste the following link into your browser:</p>
                <p style="background: #e5e7eb; padding: 10px; border-radius: 4px; word-break: break-all;">
                    <a href="${resetLink}">${resetLink}</a>
                </p>

                <div class="warning">
                    <strong>⚠️ Important:</strong> This reset link will expire in 30 minutes for your security.
                </div>

                <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>

                <p>For security reasons, if you continue to receive these emails, please contact our support team immediately.</p>

                <p>Best regards,<br>The ${this.appName} Team</p>
            </div>
            <div class="footer">
                <p>© 2023 ${this.appName}. All rights reserved.</p>
                <p>This is an automated email. Please do not reply to this message.</p>
            </div>
        </div>
    </body>
    </html>`;
  }

  private getPasswordResetEmailText(firstName: string, resetLink: string): string {
    return `
Password Reset Request - ${this.appName}

Hello, ${firstName}

We received a request to reset the password for your ${this.appName} account.

To reset your password, please visit the following link:
${resetLink}

⚠️ Important: This reset link will expire in 30 minutes for your security.

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

For security reasons, if you continue to receive these emails, please contact our support team immediately.

Best regards,
The ${this.appName} Team

This is an automated email. Please do not reply to this message.
    `.trim();
  }

  private getWelcomeEmailTemplate(firstName: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${this.appName}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #16a34a; }
            .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Welcome to ${this.appName}!</h1>
            </div>
            <div class="content">
                <h2>Congratulations, ${firstName}!</h2>
                <p>Your email has been verified and your ${this.appName} account is now active. You can now access all features of our secure digital wallet platform.</p>

                <h3>What you can do now:</h3>

                <div class="feature">
                    <strong>💰 Wallet Management</strong><br>
                    Add funds, send money, and track your transactions securely.
                </div>

                <div class="feature">
                    <strong>🔒 Enhanced Security</strong><br>
                    Your account is protected with advanced security features and fraud detection.
                </div>

                <div class="feature">
                    <strong>📱 Mobile Access</strong><br>
                    Access your wallet anytime, anywhere with our mobile-friendly platform.
                </div>

                <div class="feature">
                    <strong>🤝 P2P Transfers</strong><br>
                    Send and receive money instantly with other ${this.appName} users.
                </div>

                <p>If you have any questions or need assistance, our support team is here to help.</p>

                <p>Thank you for choosing ${this.appName}!</p>

                <p>Best regards,<br>The ${this.appName} Team</p>
            </div>
            <div class="footer">
                <p>© 2023 ${this.appName}. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>`;
  }

  private getWelcomeEmailText(firstName: string): string {
    return `
🎉 Welcome to ${this.appName}!

Congratulations, ${firstName}!

Your email has been verified and your ${this.appName} account is now active. You can now access all features of our secure digital wallet platform.

What you can do now:

💰 Wallet Management
Add funds, send money, and track your transactions securely.

🔒 Enhanced Security
Your account is protected with advanced security features and fraud detection.

📱 Mobile Access
Access your wallet anytime, anywhere with our mobile-friendly platform.

🤝 P2P Transfers
Send and receive money instantly with other ${this.appName} users.

If you have any questions or need assistance, our support team is here to help.

Thank you for choosing ${this.appName}!

Best regards,
The ${this.appName} Team
    `.trim();
  }

  private getPasswordChangedEmailTemplate(firstName: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Changed - ${this.appName}</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .alert { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${this.appName}</h1>
                <h2>Password Changed Successfully</h2>
            </div>
            <div class="content">
                <h2>Hello, ${firstName}</h2>
                <p>This email confirms that your ${this.appName} account password has been successfully changed.</p>

                <div class="alert">
                    <strong>🔒 Security Notice:</strong> If you did not make this change, please contact our support team immediately.
                </div>

                <p><strong>Change Details:</strong></p>
                <ul>
                    <li>Date: ${new Date().toLocaleDateString()}</li>
                    <li>Time: ${new Date().toLocaleTimeString()}</li>
                </ul>

                <p>Your account security is important to us. Here are some tips to keep your account secure:</p>
                <ul>
                    <li>Use a strong, unique password</li>
                    <li>Enable two-factor authentication when available</li>
                    <li>Never share your login credentials</li>
                    <li>Log out from shared or public devices</li>
                </ul>

                <p>If you have any concerns about your account security, please don't hesitate to contact our support team.</p>

                <p>Best regards,<br>The ${this.appName} Team</p>
            </div>
            <div class="footer">
                <p>© 2023 ${this.appName}. All rights reserved.</p>
                <p>This is an automated email. Please do not reply to this message.</p>
            </div>
        </div>
    </body>
    </html>`;
  }

  private getPasswordChangedEmailText(firstName: string): string {
    return `
Password Changed Successfully - ${this.appName}

Hello, ${firstName}

This email confirms that your ${this.appName} account password has been successfully changed.

🔒 Security Notice: If you did not make this change, please contact our support team immediately.

Change Details:
- Date: ${new Date().toLocaleDateString()}
- Time: ${new Date().toLocaleTimeString()}

Your account security is important to us. Here are some tips to keep your account secure:
- Use a strong, unique password
- Enable two-factor authentication when available
- Never share your login credentials
- Log out from shared or public devices

If you have any concerns about your account security, please don't hesitate to contact our support team.

Best regards,
The ${this.appName} Team

This is an automated email. Please do not reply to this message.
    `.trim();
  }

  async verifyConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      this.logger.error('Email service verification failed', error);
      return false;
    }
  }
}