'use strict';

const { JobExecutor } = require('./JobExecutor');

// ── Next-run computation (exported for IPC layer reuse) ──────
function computeNextRun(scheduleType, config, afterDate) {
  const from = new Date(afterDate || Date.now());

  switch (scheduleType) {
    case 'ONCE': {
      if (!config.datetime) return null;
      return new Date(config.datetime);
    }
    case 'HOURLY': {
      const interval = Math.max(1, Number(config.interval) || 1);
      return new Date(from.getTime() + interval * 3600 * 1000);
    }
    case 'DAILY': {
      const [h, m] = (config.time || '00:00').split(':').map(Number);
      const next   = new Date(from);
      next.setHours(h, m, 0, 0);
      if (next <= from) next.setDate(next.getDate() + 1);
      return next;
    }
    case 'WEEKLY': {
      const [h, m]   = (config.time || '00:00').split(':').map(Number);
      const targetDay = config.dayOfWeek != null ? Number(config.dayOfWeek) : 1;
      const next      = new Date(from);
      next.setHours(h, m, 0, 0);
      let daysAhead = targetDay - next.getDay();
      if (daysAhead < 0 || (daysAhead === 0 && next <= from)) daysAhead += 7;
      if (daysAhead > 0) next.setDate(next.getDate() + daysAhead);
      return next;
    }
    default: return null;
  }
}

class SchedulerEngine {
  // jobQueue: optional (Stage 10+). When provided, jobs go through queue → RobotAgent.
  //           When null (Stage 9 fallback), jobs execute locally inside JobExecutor.
  constructor({ schedRepo, workflowRepo, execRepo, onLog, onJobComplete, jobQueue }) {
    this.schedRepo   = schedRepo;
    this._interval   = null;
    this._triggering = new Set();
    this._onLog      = onLog || (() => {});

    this._executor = new JobExecutor({
      workflowRepo,
      execRepo,
      onLog:      onLog        || (() => {}),
      onComplete: onJobComplete || (() => {}),
      jobQueue:   jobQueue     || null,
    });
  }

  start() {
    this._recalculateMissed();
    // Tick every 30 seconds
    this._interval = setInterval(() => this._tick(), 30_000);
    this._log('INFO', '[Scheduler] Engine started — checking every 30s');
  }

  stop() {
    if (this._interval) { clearInterval(this._interval); this._interval = null; }
    this._log('INFO', '[Scheduler] Engine stopped');
  }

  _log(level, message) {
    this._onLog({ level, message, timestamp: new Date().toISOString().substring(11, 19) });
  }

  // On startup: skip missed schedules by recomputing nextRunAt from now.
  // This prevents a backlog of missed runs firing all at once after restart.
  _recalculateMissed() {
    const now       = new Date();
    const schedules = this.schedRepo.listSchedules();
    for (const s of schedules) {
      if (s.status !== 'ACTIVE' || !s.nextRunAt) continue;
      if (new Date(s.nextRunAt) < now) {
        const next = computeNextRun(s.scheduleType, s.config, now);
        this.schedRepo.updateSchedule(s.id, { nextRunAt: next ? next.toISOString() : null });
        this._log('WARN', `[Scheduler] Missed run for "${s.name}" — rescheduled to ${next?.toISOString() ?? 'N/A'}`);
      }
    }
  }

  async _tick() {
    const now       = new Date();
    const schedules = this.schedRepo.listSchedules()
      .filter(s => s.status === 'ACTIVE' && s.nextRunAt && new Date(s.nextRunAt) <= now);

    for (const sched of schedules) {
      if (this._triggering.has(sched.id)) continue;
      this._triggering.add(sched.id);
      this._trigger(sched, now).finally(() => this._triggering.delete(sched.id));
    }
  }

  async _trigger(sched, now) {
    const isOnce  = sched.scheduleType === 'ONCE';
    const nextRun = isOnce ? null : computeNextRun(sched.scheduleType, sched.config, now);

    // Update schedule state before execution to prevent re-trigger on next tick
    this.schedRepo.updateSchedule(sched.id, {
      lastRunAt: now.toISOString(),
      nextRunAt: nextRun ? nextRun.toISOString() : null,
      ...(isOnce ? { status: 'DISABLED' } : {}),
    });

    const job = {
      jobId:           `job_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      scheduleId:      sched.id,
      workflowId:      sched.workflowId,
      workflowVersion: sched.workflowVersion,
      triggeredAt:     now.toISOString(),
      executionSource: 'SCHEDULED',
    };

    this._log('INFO', `[Scheduler] Triggering "${sched.name}" (${sched.scheduleType})`);
    await this._executor.execute(job);
  }
}

module.exports = { SchedulerEngine, computeNextRun };
