import { preloadDb } from './repository.web';

export async function initDb(): Promise<void> {
  await preloadDb();
}

export { newId, nowIso } from '@/lib/db/shared';
