export interface MailMessage {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface MailResult {
  messageId: string;
}

export interface Mailer {
  sendMail(message: MailMessage): Promise<MailResult>;
  verify?(): Promise<void>;
}
