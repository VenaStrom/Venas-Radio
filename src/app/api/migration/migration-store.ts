type MigrationPayload = Record<string, string>;

type MigrationEntry = {
  payload: MigrationPayload;
  expiresAt: number;
};

const migrationStore = new Map<string, MigrationEntry>();

const DEFAULT_TTL_MS = 1000 * 60 * 15; // 15 minutes

function cleanupExpired(now = Date.now()) {
  for (const [id, entry] of migrationStore.entries()) {
    if (entry.expiresAt <= now) {
      migrationStore.delete(id);
    }
  }
}

export function storeMigration(payload: MigrationPayload, ttlMs = DEFAULT_TTL_MS) {
  cleanupExpired();
  const id = crypto.randomUUID();
  migrationStore.set(id, {
    payload,
    expiresAt: Date.now() + ttlMs,
  });
  return id;
}

export function loadMigration(id: string) {
  cleanupExpired();
  const entry = migrationStore.get(id);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    migrationStore.delete(id);
    return null;
  }
  migrationStore.delete(id);
  return entry.payload;
}
