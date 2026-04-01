import nodemailer from "nodemailer";
import type { Mailer, MailMessage, MailResult } from "./mailer.js";

export interface NodemailerConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
}

export class NodemailerMailer implements Mailer {
  private transporter: nodemailer.Transporter;

  constructor(config: NodemailerConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password,
      },
    });
  }

  async sendMail(message: MailMessage): Promise<MailResult> {
    const info = await this.transporter.sendMail({
      from: message.from,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });

    return { messageId: info.messageId };
  }

  async verify(): Promise<void> {
    await this.transporter.verify();
  }
}
