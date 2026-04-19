import { join } from 'path';

/** cooler-be/ — resolves correctly when running compiled output from `dist/`. */
export function getProjectRoot(): string {
  return join(__dirname, '..');
}
