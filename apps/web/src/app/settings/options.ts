export interface SettingsOptions {
  timezones: string[];
  locales: string[];
  ports: string[];
  jurisdictions: string[];
}

export const SETTINGS_OPTIONS: SettingsOptions = {
  timezones: ['UTC', 'America/Nassau', 'America/New_York', 'Europe/London'],
  locales: ['en-US', 'en-GB', 'es-ES'],
  ports: ['Nassau', 'Freeport', 'Miami', 'Fort Lauderdale'],
  jurisdictions: ['Bahamas', 'Jamaica (Phase 2)', 'Barbados (Phase 2)'],
};

export async function fetchSettingsOptions(): Promise<SettingsOptions> {
  // In the future, replace with an API call; kept sync-like for now.
  return SETTINGS_OPTIONS;
}
