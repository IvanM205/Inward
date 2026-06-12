/**
 * The vetted help resource list (SAFE-02) — versioned editorial content,
 * shipped in the fallback bundle and replaceable OTA per locale. The app
 * never claims confidentiality on behalf of these services (SAFE-04); it
 * names them and steps aside.
 */

export interface HelpResource {
  name: string;
  /** Phone number or URL, rendered as-is and dialable/openable by the host. */
  contact: string;
  note: string;
}

export const RESOURCE_LIST_VERSION = '2026.06.1';

const EN: HelpResource[] = [
  {
    name: 'Emergency services (EU)',
    contact: '112',
    note: 'If you are in immediate danger, call now.',
  },
  {
    name: 'Find a Helpline',
    contact: 'findahelpline.com',
    note: 'Free, confidential support lines for your country.',
  },
];

const SK: HelpResource[] = [
  {
    name: 'Tiesňové volanie',
    contact: '112',
    note: 'Ak ste v bezprostrednom ohrození, volajte hneď.',
  },
  {
    name: 'Linka dôvery Nezábudka',
    contact: '0800 800 566',
    note: 'Bezplatná nonstop linka pre ľudí v kríze.',
  },
  {
    name: 'IPčko',
    contact: 'ipcko.sk',
    note: 'Bezplatná anonymná pomoc cez chat, každý deň.',
  },
];

export function helpResources(locale: string): HelpResource[] {
  return locale.toLowerCase().startsWith('sk') ? SK : EN;
}
