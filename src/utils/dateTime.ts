export function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function fmtDate(d: Date | number | string): string {
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return '';
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${String(date.getFullYear()).slice(-2)}`;
}

export function fmtTime(d: Date | number | string): string {
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return '';
  return `${pad(date.getHours())}.${pad(date.getMinutes())}`;
}

export function fmtDT(d: Date | number | string = new Date()): string {
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return '';
  return `${fmtDate(date)} ${fmtTime(date)}`;
}

export function getCurrent24Time(): string {
  return fmtDT(new Date());
}

/**
 * Parses "15/08/26 14.30" or "14.30" or "15/08/26" into a Date object.
 */
export function parseDT(str: string): Date | null {
  if (!str) return null;
  const clean = String(str).trim();
  let datePart: string | null = null;
  let timePart: string | null = null;
  const parts = clean.split(/\s+/);
  
  for (const part of parts) {
    if (/^\d{1,2}[./-]\d{1,2}([./-]\d{2,4})?$/.test(part)) {
      datePart = part;
    } else if (/^\d{1,2}[.:]\d{2}$/.test(part)) {
      timePart = part;
    }
  }

  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  let day = now.getDate();

  if (datePart) {
    const segs = datePart.split(/[./-]/);
    day = parseInt(segs[0], 10);
    month = parseInt(segs[1], 10) - 1;
    if (segs[2]) {
      let yr = parseInt(segs[2], 10);
      if (yr < 100) yr += 2000;
      year = yr;
    }
  }

  let hours = now.getHours();
  let minutes = now.getMinutes();

  if (timePart) {
    const segs = timePart.split(/[.:]/);
    hours = parseInt(segs[0], 10);
    minutes = parseInt(segs[1], 10);
  }

  const parsed = new Date(year, month, day, hours, minutes);
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function generateUid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function hashPassword(pw: string): string {
  let h1 = 5381;
  let h2 = 52711;
  const salted = 'elog::' + pw + '::e5alt';
  for (let i = 0; i < salted.length; i++) {
    const c = salted.charCodeAt(i);
    h1 = ((h1 << 5) + h1 + c) | 0;
    h2 = ((h2 << 5) + h2 + (c * 31)) | 0;
  }
  return (h1 >>> 0).toString(16) + (h2 >>> 0).toString(16);
}
