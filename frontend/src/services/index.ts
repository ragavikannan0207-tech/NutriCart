import type { DataMode, NutriCartBackend } from './contracts';
import { createLocalBackend } from './local';
import { createHttpBackend } from './http';
import { probeBackend } from './http/client';
export { readCachedSession, cacheSession, clearCachedSession } from './session';

export type DataModePreference = 'auto' | 'api' | 'local';

const preference = ((import.meta.env.VITE_DATA_MODE as string | undefined) ?? 'auto').toLowerCase() as DataModePreference;

let backend: NutriCartBackend | null = null;
let resolving: Promise<NutriCartBackend> | null = null;

/**
 * Resolves the data layer exactly once per session.
 *
 *   auto  -> use Spring Boot when /api/health answers, otherwise run entirely on
 *            the browser persistence layer (same contracts, same behaviour)
 *   api   -> always Spring Boot
 *   local -> never touch the network
 */
export async function resolveBackend(): Promise<NutriCartBackend> {
  if (backend) return backend;
  if (resolving) return resolving;

  resolving = (async () => {
    if (preference === 'local') {
      backend = createLocalBackend();
      return backend;
    }
    if (preference === 'api') {
      backend = createHttpBackend();
      return backend;
    }
    const timeout = Number(import.meta.env.VITE_API_PROBE_TIMEOUT ?? 1500);
    const reachable = await probeBackend(Number.isFinite(timeout) ? timeout : 1500);
    backend = reachable ? createHttpBackend() : createLocalBackend();
    return backend;
  })();

  return resolving;
}

/** Backend already resolved (state layer resolves before rendering data). */
export function currentBackend(): NutriCartBackend | null {
  return backend;
}

export function currentMode(): DataMode {
  return backend?.mode ?? (preference === 'local' ? 'local' : 'local');
}

export function modeLabel(mode: DataMode): string {
  return mode === 'api' ? 'Spring Boot API + MySQL' : 'On-device storage';
}

export function modeDescription(mode: DataMode): string {
  return mode === 'api'
    ? 'Connected to the NutriCart Java Spring Boot API. Every account, order, pantry item and receipt is stored in MySQL.'
    : 'The Spring Boot API was not reachable, so NutriCart is running on its built-in browser persistence layer. The same contracts, rules and screens are used — start the backend and reload to switch to MySQL with no data loss in the UI.';
}

/** Used by Settings → Reset demo data. */
export function currentPreference(): DataModePreference {
  return preference;
}

export { probeBackend };
export type { NutriCartBackend, DataMode };
