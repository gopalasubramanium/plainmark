export interface Preferences { recovery: boolean; spellcheck: boolean; html: boolean }
const key = 'plainmark.preferences.v1';
export const preferences: Preferences = { recovery: true, spellcheck: false, html: true };
try {
  const saved = JSON.parse(localStorage.getItem(key) ?? '{}');
  for (const name of ['recovery', 'spellcheck', 'html'] as const) if (typeof saved?.[name] === 'boolean') preferences[name] = saved[name];
} catch { /* Storage is optional; conservative defaults remain usable. */ }
export function savePreferences(values: Preferences): boolean {
  Object.assign(preferences, values);
  try { localStorage.setItem(key, JSON.stringify(preferences)); return true; } catch { return false; }
}
export function clearRecovery() {
  localStorage.removeItem('plainmark.recovery.v2');
  localStorage.removeItem('plainmark.recovery.v1');
}
