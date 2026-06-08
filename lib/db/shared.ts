export function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function daysWithin(iso: string | null, days: number): boolean {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() <= days * 86400000;
}

export { daysWithin };

export function compareWeekLabels(a: string, b: string): number {
  const parse = (label: string) => {
    const match = label.match(/^S(\d+)\s+(\d+)$/);
    if (!match) return { year: 0, week: 0 };
    return { week: parseInt(match[1], 10), year: parseInt(match[2], 10) };
  };
  const pa = parse(a);
  const pb = parse(b);
  if (pa.year !== pb.year) return pa.year - pb.year;
  return pa.week - pb.week;
}
