export interface EmailAccountConfig {
  id: string;
  email: string;
  password: string;
  imapHost: string;
  imapPort: number;
}

export function getEmailAccounts(): EmailAccountConfig[] {
  const accounts: EmailAccountConfig[] = [];
  
  // Account 1
  if (process.env.EMAIL_1_ADDRESS) {
    accounts.push({
      id: 'account-1',
      email: process.env.EMAIL_1_ADDRESS,
      password: process.env.EMAIL_1_PASSWORD || '',
      imapHost: process.env.EMAIL_1_IMAP_HOST || 'imap.gmail.com',
      imapPort: parseInt(process.env.EMAIL_1_IMAP_PORT || '993'),
    });
  }
  
  // Account 2
  if (process.env.EMAIL_2_ADDRESS) {
    accounts.push({
      id: 'account-2',
      email: process.env.EMAIL_2_ADDRESS,
      password: process.env.EMAIL_2_PASSWORD || '',
      imapHost: process.env.EMAIL_2_IMAP_HOST || 'imap.gmail.com',
      imapPort: parseInt(process.env.EMAIL_2_IMAP_PORT || '993'),
    });
  }
  
  return accounts;
}
