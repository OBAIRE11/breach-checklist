// Keep in sync with DATA_TYPES and stepsFor() in the website's index.html.

export type DataType = 'password' | 'ssn' | 'financial' | 'email' | 'phone' | 'address' | 'security_q' | 'gov_id';

export const DATA_TYPES: Record<DataType, { label: string; severity: 'high' | 'mid' }> = {
  password: { label: 'passwords', severity: 'high' },
  ssn: { label: 'SSN', severity: 'high' },
  financial: { label: 'financial info', severity: 'high' },
  email: { label: 'email addresses', severity: 'mid' },
  phone: { label: 'phone numbers', severity: 'mid' },
  address: { label: 'home address', severity: 'mid' },
  security_q: { label: 'security questions', severity: 'high' },
  gov_id: { label: "driver's license / gov ID", severity: 'high' },
};

const TYPE_ORDER = Object.keys(DATA_TYPES) as DataType[];

export const isDataType = (t: string): t is DataType => t in DATA_TYPES;

/** Known types only, in a consistent order, with duplicates removed. */
export function orderTypes(types: string[]): DataType[] {
  return TYPE_ORDER.filter(t => types.includes(t));
}

/** Short summary for picker chips: first two data types, then "+N". */
export function typeSummary(types: DataType[]): string {
  const labels = types.map(t => DATA_TYPES[t].label);
  return labels.slice(0, 2).join(', ') + (labels.length > 2 ? ' +' + (labels.length - 2) : '');
}

export type Step = { title: string; detail: string; priority: 'now' | 'soon' };

export function stepsFor(types: DataType[]): Step[] {
  const steps: Step[] = [];
  const add = (title: string, priority: Step['priority'], detail: string) => steps.push({ title, detail, priority });

  if (types.includes('password')) {
    add('Change the password on this account', 'now',
      'Do this first, immediately, even before reading the rest of this list.');
    add('Change that password anywhere else you reused it', 'now',
      'If you use the same password on other sites, a breached one gives attackers a key to all of them.');
    add('Turn on two-factor authentication', 'now',
      'Use an authenticator app rather than SMS if the option exists.');
  }
  if (types.includes('security_q')) {
    add('Update your security questions', 'soon',
      'Treat exposed answers as compromised — attackers can use them to reset passwords elsewhere.');
  }
  if (types.includes('financial')) {
    add('Call your bank or card issuer', 'now',
      'Ask them to flag or reissue the card if card numbers were involved.');
    add('Review recent statements for unfamiliar charges', 'now',
      'Check the last 30-60 days, not just the last few days.');
  }
  if (types.includes('ssn')) {
    add('Freeze your credit at all three bureaus', 'now',
      'Equifax, Experian, and TransUnion. Freezing is free and stops new accounts from being opened in your name.');
    add('Set up a fraud alert', 'soon',
      'A free 1-year fraud alert makes lenders verify your identity before opening new credit.');
    add('Watch for an IRS or tax notice', 'soon',
      'SSN leaks are sometimes used for tax fraud. Consider filing early next season.');
  }
  if (types.includes('email')) {
    add('Watch for phishing emails referencing this breach', 'soon',
      "Scammers use real breach news to make fake 'verify your account' emails look legitimate.");
  }
  if (types.includes('phone')) {
    add('Be alert for SIM-swap attempts', 'soon',
      'Call your carrier and add a PIN or passcode required for any changes to your account.');
  }
  if (types.includes('gov_id')) {
    add('Report the exposed ID to your state DMV or issuing agency', 'soon',
      'Ask whether a replacement license or ID number is warranted given the exposure.');
    add('Add a note to your credit file about the exposed ID', 'soon',
      "A stolen driver's license or passport number can be used to open accounts in your name, same as an SSN.");
  }
  if (types.includes('address')) {
    add('Watch your mail for anything unexpected', 'soon',
      "New account confirmations or credit card offers you didn't request are a red flag.");
  }
  add('Check haveibeenpwned.com for this and other exposures', 'soon',
    'See the full list of breaches tied to your email address.');
  return steps;
}
