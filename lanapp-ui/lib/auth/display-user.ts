export type DisplayUserInput = {
  email: string;
  username?: string;
  preferredUsername?: string | null;
};

function capitalizeWord(word: string): string {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/** Derive a friendly name from the local part of an email (maria.garcia@ → Maria Garcia). */
export function nameFromEmail(email: string): string {
  const local = email.split('@')[0]?.trim() ?? '';
  if (!local) return email;

  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map(capitalizeWord)
    .join(' ');
}

export function displayName(user: DisplayUserInput): string {
  const preferred = user.preferredUsername?.trim();
  if (preferred) return preferred;

  const email = user.email?.trim();
  if (email) return nameFromEmail(email);

  const username = user.username?.trim();
  if (username && !username.includes('@')) return username;

  return 'Usuario';
}

export function userInitials(user: DisplayUserInput): string {
  const source = displayName(user);
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function shortDisplayName(user: DisplayUserInput): string {
  const full = displayName(user);
  const parts = full.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return full;
  return `${parts[0]} ${parts[1]!.charAt(0)}.`;
}
