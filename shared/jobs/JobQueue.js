'use strict';

const fs   = require('fs');
const path = require('path');

const MAX_JOBS = 500;

class JobQueue {
  constructor({ jobsFile }) {
    this.jobsFile = jobsFile;
    const dir = path.dirname(jobsFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(jobsFile)) fs.writeFileSync(jobsFile, '[]', 'utf-8');
  }

  _load() {
    try { return JSON.parse(fs.readFileSync(this.jobsFile, 'utf-8')); }
    catch (_) { return []; }
  }

  _save(jobs) {
    fs.writeFileSync(this.jobsFile, JSON.stringify(jobs, null, 2), 'utf-8');
  }

  // ── Create a new job (returns full job with flowData) ────────
  createJob({ workflowId, workflowVersion, source, flowData, metadata }) {
    const id  = `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const job = {
      id,
      workflowId,
      workflowVersion: workflowVersion != null ? workflowVersion : null,
      source:          source || 'MANUAL',   // MANUAL | SCHEDULED
      status:          'PENDING',
      flowData:        flowData || null,      // inline for MANUAL, null for published
      metadata:        metadata || {},
      createdAt:       new Date().toISOString(),
      startedAt:       null,
      completedAt:     null,
      robotId:         null,
      runId:           null,
      error:           null,
    };
    const all = this._load();
    all.unshift(job);
    if (all.length > MAX_JOBS) all.length = MAX_JOBS;
    this._save(all);
    return job;
  }

  // ── Claim the next PENDING job (PENDING → RUNNING) ───────────
  // Single-robot safe; Stage 11 needs file locking for multi-robot.
  claimNextJob(robotId) {
    const all = this._load();
    const idx = all.findIndex(j => j.status === 'PENDING');
    if (idx === -1) return null;
    all[idx].status    = 'RUNNING';
    all[idx].startedAt = new Date().toISOString();
    all[idx].robotId   = robotId;
    this._save(all);
    return all[idx];
  }

  updateJob(id, updates) {
    const all = this._load();
    const idx = all.findIndex(j => j.id === id);
    if (idx !== -1) { all[idx] = { ...all[idx], ...updates }; this._save(all); }
  }

  getJob(id) {
    return this._load().find(j => j.id === id) || null;
  }

  // ── List jobs (strips large flowData from results) ───────────
  listJobs({ status, limit } = {}) {
    let all = this._load();
    if (status) all = all.filter(j => j.status === status);
    if (limit)  all = all.slice(0, limit);
    return all.map(({ flowData: _, ...rest }) => rest);
  }

  // ── Mark any RUNNING jobs as FAILED (called on startup) ──────
  resetStuckJobs() {
    const all = this._load();
    let changed = false;
    for (const job of all) {
      if (job.status === 'RUNNING') {
        job.status      = 'FAILED';
        job.completedAt = new Date().toISOString();
        job.error       = 'Interrupted: application was closed during execution';
        changed         = true;
      }
    }
    if (changed) this._save(all);
  }
}

module.exports = { JobQueue };
