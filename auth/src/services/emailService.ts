import nodemailer from 'nodemailer';

export interface EmailConfig {
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
}

export interface EmailOptions {
    from: string;
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor(config: EmailConfig) {
        this.transporter = nodemailer.createTransport({
            ...config,
            connectionTimeout: 60000,
            greetingTimeout: 30000,
            socketTimeout: 60000,
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
            rateLimit: 10,
            debug: process.env.NODE_ENV === 'development',
            logger: process.env.NODE_ENV === 'development',
        });

        this.transporter.verify((error, _success) => {
            if (error) {
                console.error('SMTP connection verification failed:', error);
            } else {
                console.log('SMTP connection verified successfully');
            }
        });
    }

    async sendEmail(options: EmailOptions, retries: number = 3): Promise<void> {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                await this.transporter.sendMail({
                    from: process.env.EMAIL_FROM || 'noreply@yourapp.com',
                    to: options.to,
                    subject: options.subject,
                    html: options.html,
                    text: options.text,
                });
                console.log(`Email sent successfully to ${options.to} (attempt ${attempt})`);
                return;
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : String(error);
                console.error(`Email sending failed (attempt ${attempt}/${retries}):`, message);

                if (attempt === retries) {
                    throw new Error(`Failed to send email after ${retries} attempts: ${message}`);
                }

                const delay = Math.pow(2, attempt) * 1000;
                console.log(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    async sendConfirmationEmail(
        from: string,
        to: string,
        username: string,
        confirmationLink: string
    ): Promise<void> {
        const subject = 'Confirm Your Registration';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Welcome ${username}!</h2>
                <p>Thank you for registering. Please confirm your email address to complete your registration.</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${confirmationLink}" 
                       style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        Confirm Registration
                    </a>
                </div>
                
                <p style="color: #666; font-size: 14px; margin-top: 30px;">
                    If you didn't create an account, please ignore this email.
                </p>
            </div>
        `;

        const text = `
            Welcome ${username}!
            
            Thank you for registering. Please confirm your email address to complete your registration.
            
            Confirmation Link: ${confirmationLink}
            
            If you didn't create an account, please ignore this email.
        `;

        await this.sendEmail({ from, to, subject, html, text }, 3);
    }
}

export const createEmailService = (config: EmailConfig): EmailService => {
    return new EmailService(config);
};
