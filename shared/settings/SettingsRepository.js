'use strict';

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const DEFAULTS = {
  notifications: {
    desktopOnSuccess: true,
    desktopOnFailure: true,
    emailEnabled:     false,
    emailOnSuccess:   false,
    emailOnFailure:   true,
    smtp: { host: '', port: 587, secure: false, user: '', pass: '', to: '' },
  },
  robotApi: {
    enabled: false,
    port:    3456,
    token:   '',
  },
};

function deepMerge(defaults, overrides) {
  const result = { ...defaults };
  for (const [k, v] of Object.entries(overrides || {})) {
    result[k] = (typeof v === 'object' && v !== null && !Array.isArray(v))
      ? deepMerge(defaults[k] || {}, v)
      : v;
  }
  return result;
}

class SettingsRepository {
  constructor({ settingsFile }) {
    ensureDir(path.dirname(settingsFile));
    this._file = settingsFile;
    this._data = this._load();
  }

  _load() {
    if (!fs.existsSync(this._file)) return JSON.parse(JSON.stringify(DEFAULTS));
    try {
      return deepMerge(DEFAULTS, JSON.parse(fs.readFileSync(this._file, 'utf-8')));
    } catch { return JSON.parse(JSON.stringify(DEFAULTS)); }
  }

  _save() {
    fs.writeFileSync(this._file, JSON.stringify(this._data, null, 2), 'utf-8');
  }

  get() { return JSON.parse(JSON.stringify(this._data)); }

  set(updates) {
    this._data = deepMerge(this._data, updates);
    this._save();
    return this.get();
  }

  ensureRobotToken() {
    if (!this._data.robotApi.token) {
      this._data.robotApi.token = crypto.randomBytes(28).toString('hex');
      this._save();
    }
    return this._data.robotApi.token;
  }
}

module.exports = { SettingsRepository };
