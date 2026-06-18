/** Cognito group prefix for this app (must match Terraform groups: lanapp_admin, …). */
export const COGNITO_APP_PREFIX = 'lanapp_';

export const LANAPP_ROLES = ['admin', 'veterinario', 'operario'] as const;
export type LanappRole = (typeof LANAPP_ROLES)[number];

export function lanappGroupForRole(role: LanappRole): string {
  return `${COGNITO_APP_PREFIX}${role}`;
}

export function rolesFromGroups(groups: string[]): LanappRole[] {
  const roles = groups
    .filter((g) => g.startsWith(COGNITO_APP_PREFIX))
    .map((g) => g.slice(COGNITO_APP_PREFIX.length))
    .filter((r): r is LanappRole => LANAPP_ROLES.includes(r as LanappRole));

  if (groups.includes('platform_admin') && !roles.includes('admin')) {
    roles.push('admin');
  }

  return roles;
}

export function hasLanappRole(groups: string[], role: LanappRole): boolean {
  return rolesFromGroups(groups).includes(role);
}

export function isLanappAdmin(groups: string[]): boolean {
  return hasLanappRole(groups, 'admin');
}
