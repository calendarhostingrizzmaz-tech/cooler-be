import { config } from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';
import { getProjectRoot } from './env-paths';

let didLoad = false;

/**
 * Load `.env` then `.env.<NODE_ENV>` from the package root (not cwd).
 * Second file overrides the first so `.env.development` wins on duplicates.
 */
export function loadAppEnv(): void {
  if (didLoad) return;
  didLoad = true;

  const root = getProjectRoot();
  const base = join(root, '.env');
  const envName = process.env.NODE_ENV || 'development';
  const envSpecific = join(root, `.env.${envName}`);

  if (existsSync(base)) {
    config({ path: base });
  }
  if (existsSync(envSpecific)) {
    config({ path: envSpecific, override: true });
  }
}

/** Runs as soon as this module is imported (must be imported before AppModule). */
loadAppEnv();
