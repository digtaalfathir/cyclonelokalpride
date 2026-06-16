'use strict';

const fs   = require('fs');
const path = require('path');

class RobotRegistry {
  constructor({ registryFile }) {
    this.registryFile = registryFile;
    const dir = path.dirname(registryFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(registryFile)) fs.writeFileSync(registryFile, '[]', 'utf-8');
  }

  _load() {
    try { return JSON.parse(fs.readFileSync(this.registryFile, 'utf-8')); }
    catch (_) { return []; }
  }

  _save(robots) {
    fs.writeFileSync(this.registryFile, JSON.stringify(robots, null, 2), 'utf-8');
  }

  // ── Register or update a robot ───────────────────────────────
  registerRobot(robotId, meta) {
    const all   = this._load();
    const idx   = all.findIndex(r => r.robotId === robotId);
    const entry = {
      robotId,
      name:         meta.name         || robotId,
      capabilities: meta.capabilities || [],
      status:       'ONLINE',
      registeredAt: new Date().toISOString(),
      lastSeen:     new Date().toISOString(),
    };
    if (idx !== -1) {
      all[idx] = { ...all[idx], ...entry };
    } else {
      all.push(entry);
    }
    this._save(all);
    return idx !== -1 ? all[idx] : entry;
  }

  // ── Update heartbeat + status ────────────────────────────────
  updateHeartbeat(robotId, status) {
    const all = this._load();
    const idx = all.findIndex(r => r.robotId === robotId);
    if (idx !== -1) {
      all[idx].status   = status;   // ONLINE | OFFLINE | BUSY
      all[idx].lastSeen = new Date().toISOString();
      this._save(all);
    }
  }

  listRobots() {
    return this._load();
  }

  getOnlineRobots() {
    return this._load().filter(r => r.status !== 'OFFLINE');
  }
}

module.exports = { RobotRegistry };
