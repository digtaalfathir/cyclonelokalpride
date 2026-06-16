'use strict';

const fs   = require('fs');
const path = require('path');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

class AuditRepository {
  constructor({ auditFile }) {
    ensureDir(path.dirname(auditFile));
    this._file = auditFile;
  }

  log({ action, actor = 'user', details = {} }) {
    const entry = {
      id:        `a${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      actor,
      details,
    };
    try {
      fs.appendFileSync(this._file, JSON.stringify(entry) + '\n', 'utf-8');
    } catch (_) {}
    return entry;
  }

  list({ limit = 200, action: filterAction } = {}) {
    if (!fs.existsSync(this._file)) return [];
    try {
      const lines = fs.readFileSync(this._file, 'utf-8').trim().split('\n').filter(Boolean);
      let entries = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
      if (filterAction) entries = entries.filter(e => e.action === filterAction);
      return entries.slice(-limit).reverse();
    } catch { return []; }
  }
}

module.exports = { AuditRepository };
