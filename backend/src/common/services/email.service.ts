import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: any[];
}

export interface OTPEmailData {
  name: string;
  otp: string;
  expiresIn: number; // minutes
  purpose: 'verification' | 'password_reset' | 'login';
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpConfig = {
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT') || 587,
      secure: this.configService.get<boolean>('SMTP_SECURE') || false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    };

    this.transporter = nodemailer.createTransport(smtpConfig);
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: {
          name: 'Nolojia Wallet',
          address: this.configService.get<string>('SMTP_USER'),
        },
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  async sendOTPEmail(email: string, data: OTPEmailData): Promise<boolean> {
    const subject = this.getOTPSubject(data.purpose);
    const html = this.generateOTPEmailHTML(data);

    return await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  async sendWelcomeEmail(email: string, name: string, userCode: string): Promise<boolean> {
    const subject = 'Welcome to Nolojia Wallet! 🎉';
    const html = this.generateWelcomeEmailHTML(name, userCode);

    return await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  async sendPasswordResetEmail(email: string, name: string, resetToken: string): Promise<boolean> {
    const subject = 'Reset Your Nolojia Wallet Password';
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${resetToken}`;
    const html = this.generatePasswordResetEmailHTML(name, resetUrl);

    return await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  async sendTransactionNotification(
    email: string,
    name: string,
    transactionData: any,
  ): Promise<boolean> {
    const subject = `Nolojia Wallet - Transaction ${transactionData.status}`;
    const html = this.generateTransactionEmailHTML(name, transactionData);

    return await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  private getOTPSubject(purpose: string): string {
    switch (purpose) {
      case 'verification':
        return 'Verify Your Nolojia Wallet Account';
      case 'password_reset':
        return 'Reset Your Nolojia Wallet Password';
      case 'login':
        return 'Nolojia Wallet - Login Verification Code';
      default:
        return 'Nolojia Wallet - Verification Code';
    }
  }

  private generateOTPEmailHTML(data: OTPEmailData): string {
    const purposeText = {
      verification: 'verify your account',
      password_reset: 'reset your password',
      login: 'complete your login',
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nolojia Wallet - Verification Code</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 30px; text-align: center; }
            .logo { color: white; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .content { padding: 40px 30px; }
            .otp-box { background-color: #f8f9fa; border: 2px dashed #dc2626; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #dc2626; letter-spacing: 5px; font-family: 'Courier New', monospace; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
            .button { display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .warning { background-color: #fef3cd; border: 1px solid #facc15; border-radius: 6px; padding: 15px; margin: 20px 0; color: #92400e; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🏦 Nolojia Wallet</div>
                <p style="color: white; margin: 0;">Secure. Fast. Reliable.</p>
            </div>

            <div class="content">
                <h2>Hello ${data.name}!</h2>
                <p>You've requested to ${purposeText[data.purpose] || 'verify your account'}. Please use the verification code below:</p>

                <div class="otp-box">
                    <p style="margin: 0 0 10px 0; font-weight: bold;">Your Verification Code:</p>
                    <div class="otp-code">${data.otp}</div>
                    <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">
                        This code expires in ${data.expiresIn} minutes
                    </p>
                </div>

                <div class="warning">
                    <strong>Security Notice:</strong>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>Never share this code with anyone</li>
                        <li>Nolojia Wallet will never ask for this code via phone or email</li>
                        <li>If you didn't request this code, please secure your account immediately</li>
                    </ul>
                </div>

                <p>If you're having trouble, please contact our support team at support@nolojia.com</p>

                <p>Best regards,<br>The Nolojia Wallet Team</p>
            </div>

            <div class="footer">
                <p>&copy; 2024 Nolojia Wallet. All rights reserved.</p>
                <p>This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private generateWelcomeEmailHTML(name: string, userCode: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Nolojia Wallet</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 30px; text-align: center; }
            .logo { color: white; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .content { padding: 40px 30px; }
            .user-code-box { background-color: #f8f9fa; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; }
            .feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
            .feature { text-align: center; padding: 20px; background-color: #f8f9fa; border-radius: 8px; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
            .button { display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🏦 Nolojia Wallet</div>
                <h1 style="color: white; margin: 20px 0 10px 0;">Welcome Aboard!</h1>
                <p style="color: white; margin: 0;">Your digital wallet is ready to use</p>
            </div>

            <div class="content">
                <h2>Hello ${name}! 🎉</h2>
                <p>Congratulations! Your Nolojia Wallet account has been successfully created. You're now part of Kenya's most secure digital wallet platform.</p>

                <div class="user-code-box">
                    <h3 style="margin: 0 0 10px 0;">Your Unique User Code:</h3>
                    <p style="font-size: 18px; font-weight: bold; color: #dc2626; margin: 0; font-family: 'Courier New', monospace;">${userCode}</p>
                    <p style="font-size: 14px; color: #6b7280; margin: 10px 0 0 0;">Use this code for quick transfers and account identification</p>
                </div>

                <h3>What can you do with Nolojia Wallet?</h3>

                <div class="feature-grid">
                    <div class="feature">
                        <div style="font-size: 30px; margin-bottom: 10px;">💰</div>
                        <h4>Top Up</h4>
                        <p>Add money via M-Pesa, bank transfer, or card</p>
                    </div>
                    <div class="feature">
                        <div style="font-size: 30px; margin-bottom: 10px;">💸</div>
                        <h4>Send Money</h4>
                        <p>Send money instantly to any user</p>
                    </div>
                    <div class="feature">
                        <div style="font-size: 30px; margin-bottom: 10px;">🛡️</div>
                        <h4>Escrow</h4>
                        <p>Secure transactions with buyer protection</p>
                    </div>
                    <div class="feature">
                        <div style="font-size: 30px; margin-bottom: 10px;">📊</div>
                        <h4>Analytics</h4>
                        <p>Track your spending and income</p>
                    </div>
                </div>

                <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 20px; margin: 30px 0;">
                    <h4 style="color: #0369a1; margin: 0 0 10px 0;">🔒 Security First</h4>
                    <p style="margin: 0; color: #0369a1;">Your account is protected by advanced fraud detection, two-factor authentication, and enterprise-grade encryption.</p>
                </div>

                <div style="text-align: center;">
                    <a href="${this.configService.get<string>('FRONTEND_URL')}/dashboard" class="button" style="color: white; text-decoration: none;">
                        Start Using Your Wallet
                    </a>
                </div>

                <p>If you have any questions, our support team is here to help 24/7 at support@nolojia.com</p>

                <p>Welcome to the future of digital payments!</p>
                <p>Best regards,<br>The Nolojia Wallet Team</p>
            </div>

            <div class="footer">
                <p>&copy; 2024 Nolojia Wallet. All rights reserved.</p>
                <p>Download our mobile app: <a href="#">iOS</a> | <a href="#">Android</a></p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private generatePasswordResetEmailHTML(name: string, resetUrl: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 30px; text-align: center; }
            .logo { color: white; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .content { padding: 40px 30px; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
            .button { display: inline-block; padding: 15px 30px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .warning { background-color: #fef3cd; border: 1px solid #facc15; border-radius: 6px; padding: 15px; margin: 20px 0; color: #92400e; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🏦 Nolojia Wallet</div>
                <h1 style="color: white; margin: 20px 0 10px 0;">Password Reset</h1>
                <p style="color: white; margin: 0;">Secure your account</p>
            </div>

            <div class="content">
                <h2>Hello ${name}!</h2>
                <p>We received a request to reset your Nolojia Wallet password. If you made this request, click the button below to reset your password:</p>

                <div style="text-align: center;">
                    <a href="${resetUrl}" class="button" style="color: white; text-decoration: none;">
                        Reset My Password
                    </a>
                </div>

                <p style="font-size: 14px; color: #6b7280;">
                    Or copy and paste this link into your browser:<br>
                    <a href="${resetUrl}">${resetUrl}</a>
                </p>

                <div class="warning">
                    <strong>Security Notice:</strong>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>This link will expire in 1 hour for security reasons</li>
                        <li>If you didn't request this reset, please ignore this email</li>
                        <li>Never share this link with anyone</li>
                        <li>Contact support if you believe your account is compromised</li>
                    </ul>
                </div>

                <p>If you're having trouble with the button above, copy and paste the URL into your web browser.</p>

                <p>Best regards,<br>The Nolojia Wallet Team</p>
            </div>

            <div class="footer">
                <p>&copy; 2024 Nolojia Wallet. All rights reserved.</p>
                <p>This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  private generateTransactionEmailHTML(name: string, transactionData: any): string {
    const statusColor = {
      COMPLETED: '#10b981',
      FAILED: '#ef4444',
      PENDING: '#f59e0b',
    };

    const statusIcon = {
      COMPLETED: '✅',
      FAILED: '❌',
      PENDING: '⏳',
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Transaction Notification</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 30px; text-align: center; }
            .logo { color: white; font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .content { padding: 40px 30px; }
            .transaction-box { background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">🏦 Nolojia Wallet</div>
                <h1 style="color: white; margin: 20px 0 10px 0;">Transaction Update</h1>
            </div>

            <div class="content">
                <h2>Hello ${name}!</h2>
                <p>Here's an update on your recent transaction:</p>

                <div class="transaction-box">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="margin: 0;">Transaction Details</h3>
                        <span class="status-badge" style="background-color: ${statusColor[transactionData.status]}; color: white;">
                            ${statusIcon[transactionData.status]} ${transactionData.status}
                        </span>
                    </div>

                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Transaction ID:</td>
                            <td style="padding: 8px 0;">${transactionData.id}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Amount:</td>
                            <td style="padding: 8px 0;">KES ${transactionData.amount?.toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Payment Method:</td>
                            <td style="padding: 8px 0;">${transactionData.paymentMethod}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; font-weight: bold;">Date:</td>
                            <td style="padding: 8px 0;">${new Date(transactionData.createdAt).toLocaleString()}</td>
                        </tr>
                    </table>
                </div>

                <p>Thank you for using Nolojia Wallet. Your digital financial partner.</p>

                <p>Best regards,<br>The Nolojia Wallet Team</p>
            </div>

            <div class="footer">
                <p>&copy; 2024 Nolojia Wallet. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
}