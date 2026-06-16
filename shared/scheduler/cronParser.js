'use strict';

// Minimal 5-field cron parser: "minute hour dom month dow"
// Supports: *, N, N-M, */N, N-M/N, N,M,...

function parseField(str, min, max) {
  if (str === '*') return null; // wildcard — matches any value

  const values = new Set();
  for (const part of str.split(',')) {
    if (part.includes('/')) {
      const [rangePart, stepStr] = part.split('/');
      const step = Math.max(1, Number(stepStr));
      const [from, to] = rangePart === '*'
        ? [min, max]
        : rangePart.split('-').map(Number);
      for (let i = (from || min); i <= (to || max); i += step) values.add(i);
    } else if (part.includes('-')) {
      const [from, to] = part.split('-').map(Number);
      for (let i = from; i <= to; i++) values.add(i);
    } else {
      values.add(Number(part));
    }
  }
  return values;
}

function parseCron(expression) {
  const fields = expression.trim().split(/\s+/);
  if (fields.length !== 5) throw new Error(`Invalid cron "${expression}": expected 5 fields`);
  const [min, hour, dom, month, dow] = fields;
  return {
    minute:     parseField(min,   0, 59),
    hour:       parseField(hour,  0, 23),
    dayOfMonth: parseField(dom,   1, 31),
    month:      parseField(month, 1, 12),
    dayOfWeek:  parseField(dow,   0, 6),
  };
}

// Extract wall-clock parts of a UTC date in the given IANA timezone (or local if none).
function getLocalParts(utcDate, timezone) {
  if (!timezone) {
    return {
      minute:     utcDate.getMinutes(),
      hour:       utcDate.getHours(),
      dayOfMonth: utcDate.getDate(),
      month:      utcDate.getMonth() + 1,
      dayOfWeek:  utcDate.getDay(),
    };
  }
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
      hour12: false,
    }).formatToParts(utcDate);

    const get = (type) => Number(parts.find(p => p.type === type)?.value ?? 0);
    const y  = get('year');
    const mo = get('month');   // 1-12
    const d  = get('day');
    const h  = get('hour') % 24; // midnight may appear as 24
    const m  = get('minute');

    return {
      minute:     m,
      hour:       h,
      dayOfMonth: d,
      month:      mo,
      dayOfWeek:  new Date(y, mo - 1, d).getDay(),
    };
  } catch {
    // Fallback if timezone is invalid
    return getLocalParts(utcDate, null);
  }
}

function matchesCron(cron, p) {
  if (cron.minute     && !cron.minute.has(p.minute))         return false;
  if (cron.hour       && !cron.hour.has(p.hour))             return false;
  if (cron.dayOfMonth && !cron.dayOfMonth.has(p.dayOfMonth)) return false;
  if (cron.month      && !cron.month.has(p.month))           return false;
  if (cron.dayOfWeek  && !cron.dayOfWeek.has(p.dayOfWeek))   return false;
  return true;
}

/**
 * Compute the next UTC Date when `expression` fires, starting from `afterDate`.
 * `timezone` is an IANA timezone string (e.g. "Asia/Jakarta") or null for local time.
 * Returns null if no match found within 366 days.
 */
function computeNextRunCron(expression, timezone, afterDate) {
  const cron = parseCron(expression);
  const from = new Date(afterDate || Date.now());

  // Advance to start of next minute
  let t = new Date(Math.ceil((from.getTime() + 1) / 60_000) * 60_000);

  const limit = new Date(from.getTime() + 366 * 24 * 3600_000);

  while (t <= limit) {
    if (matchesCron(cron, getLocalParts(t, timezone))) return t;
    t = new Date(t.getTime() + 60_000);
  }

  return null;
}

/**
 * Compute the next occurrence of wall-clock HH:MM in the given timezone,
 * for DAILY/WEEKLY schedules that now support timezone.
 */
function nextOccurrenceOfTime(hour, minute, dayOfWeek, timezone, afterDate) {
  const from = new Date(afterDate || Date.now());
  let t      = new Date(Math.ceil((from.getTime() + 1) / 60_000) * 60_000);
  const limit = new Date(from.getTime() + 8 * 24 * 3600_000);

  while (t <= limit) {
    const p = getLocalParts(t, timezone || null);
    const hourMatch = p.hour === hour && p.minute === minute;
    const dowMatch  = dayOfWeek == null || p.dayOfWeek === dayOfWeek;
    if (hourMatch && dowMatch) return t;
    t = new Date(t.getTime() + 60_000);
  }
  return null;
}

module.exports = { computeNextRunCron, nextOccurrenceOfTime, parseCron };
