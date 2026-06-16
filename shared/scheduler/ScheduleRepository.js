'use strict';

const fs   = require('fs');
const path = require('path');

class ScheduleRepository {
  constructor({ schedulesFile }) {
    this.schedulesFile = schedulesFile;
    const dir = path.dirname(schedulesFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(schedulesFile)) fs.writeFileSync(schedulesFile, '[]', 'utf-8');
  }

  _load() {
    try { return JSON.parse(fs.readFileSync(this.schedulesFile, 'utf-8')); }
    catch (_) { return []; }
  }

  _save(schedules) {
    fs.writeFileSync(this.schedulesFile, JSON.stringify(schedules, null, 2), 'utf-8');
  }

  createSchedule(data) {
    const id  = `sched_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();
    const schedule = {
      id,
      name:            data.name || `${data.workflowId} schedule`,
      workflowId:      data.workflowId,
      workflowVersion: data.workflowVersion,
      scheduleType:    data.scheduleType || 'DAILY',
      config:          data.config || {},
      status:          'ACTIVE',
      createdAt:       now,
      updatedAt:       now,
      lastRunAt:       null,
      nextRunAt:       data.nextRunAt || null,
    };
    const all = this._load();
    all.push(schedule);
    this._save(all);
    return schedule;
  }

  updateSchedule(id, updates) {
    const all = this._load();
    const idx = all.findIndex(s => s.id === id);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() };
    this._save(all);
    return all[idx];
  }

  deleteSchedule(id) {
    const all      = this._load();
    const filtered = all.filter(s => s.id !== id);
    this._save(filtered);
    return filtered.length < all.length;
  }

  listSchedules() {
    return this._load();
  }

  getSchedule(id) {
    return this._load().find(s => s.id === id) || null;
  }
}

module.exports = { ScheduleRepository };
