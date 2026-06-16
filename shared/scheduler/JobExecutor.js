'use strict';

// JobExecutor — abstraction boundary between Scheduler and execution.
// Stage 9: executed locally.
// Stage 10: dispatches to JobQueue → RobotAgent picks up and executes.
// Stage 11: JobQueue is remote, Robot runs on separate machine.

const { WorkflowEngine } = require('../engine/workflowEngine');

function ts() {
  return new Date().toISOString().substring(11, 19);
}

class JobExecutor {
  constructor({ workflowRepo, execRepo, onLog, onComplete, jobQueue }) {
    this.workflowRepo = workflowRepo;
    this.execRepo     = execRepo;
    this.onLog        = onLog      || (() => {});
    this.onComplete   = onComplete || (() => {});
    this._jobQueue    = jobQueue   || null;   // injected in Stage 10
    this._running     = false;
  }

  // ── Public boundary ──────────────────────────────────────────
  // Stage 10: jobQueue injected → dispatch to queue.
  // Fallback: local execution (Stage 9 behavior) when no queue.
  async execute(job) {
    if (this._jobQueue) {
      return this._dispatchToJobQueue(job);
    }
    return this._executeLocally(job);
  }

  // ── Stage 10: Dispatch to JobQueue ───────────────────────────
  async _dispatchToJobQueue(job) {
    const queued = this._jobQueue.createJob({
      workflowId:      job.workflowId,
      workflowVersion: job.workflowVersion,
      source:          job.executionSource || 'SCHEDULED',
      flowData:        null,    // Scheduler always runs published releases
      metadata:        { scheduleId: job.scheduleId, triggeredAt: job.triggeredAt },
    });
    this.onLog({
      level: 'INFO',
      message: `[Scheduler] Job queued: ${queued.id} — ${job.workflowId} v${job.workflowVersion}`,
      timestamp: ts(),
    });
    return { queued: true, jobId: queued.id };
  }

  // ── Local direct execution (Stage 9) ────────────────────────
  async _executeLocally(job) {
    const { jobId, workflowId, workflowVersion, scheduleId, executionSource } = job;

    if (this._running) {
      this.onLog({ level: 'WARN', message: `[Scheduler] Job ${jobId} skipped — another job is already running`, timestamp: ts() });
      return { skipped: true };
    }

    // Scheduler only runs Published Releases
    let release;
    try {
      release = this.workflowRepo.getVersion(workflowId, workflowVersion);
    } catch (err) {
      this.onLog({ level: 'ERROR', message: `[Scheduler] Cannot load release ${workflowId}_v${workflowVersion}: ${err.message}`, timestamp: ts() });
      return { success: false, error: err.message };
    }

    const flowData = {
      name:     release.workflowName || release.workflowId,
      version:  release.version,
      nodes:    release.nodes,
      edges:    release.edges,
      viewport: release.viewport || {},
    };

    const runId = this.execRepo.createRun({
      workflowId,
      workflowName:    release.workflowName || workflowId,
      workflowVersion,
      startTime:       new Date().toISOString(),
      executionSource: executionSource || 'SCHEDULED',
    });

    this.onLog({ level: 'INFO', message: `[Scheduler] Job ${jobId} — ${workflowId} v${workflowVersion} starting`, timestamp: ts() });
    this._running = true;

    try {
      const engine = new WorkflowEngine();
      engine.on('log', log => this.onLog(log));

      const result = await engine.execute(flowData);

      this.execRepo.updateRun(runId, {
        endTime:       new Date().toISOString(),
        duration:      result.metrics ? (result.metrics.endTime - result.metrics.startTime) : null,
        status:        result.success ? 'SUCCESS' : 'FAILED',
        nodesExecuted: result.metrics?.nodesExecuted || 0,
        nodesFailed:   result.metrics?.nodesFailed   || 0,
        error:         result.error || null,
      });

      this.onLog({
        level:   result.success ? 'SUCCESS' : 'ERROR',
        message: `[Scheduler] Job ${jobId} ${result.success ? 'completed successfully' : 'failed'}`,
        timestamp: ts(),
      });

      this.onComplete({ jobId, runId, success: result.success, scheduleId, workflowId });
      return { runId, success: result.success };

    } catch (err) {
      this.execRepo.updateRun(runId, {
        endTime: new Date().toISOString(),
        status:  'FAILED',
        error:   err.message,
      });
      this.onLog({ level: 'ERROR', message: `[Scheduler] Job ${jobId} threw: ${err.message}`, timestamp: ts() });
      this.onComplete({ jobId, runId, success: false, scheduleId, workflowId });
      return { runId, success: false, error: err.message };

    } finally {
      this._running = false;
    }
  }
}

module.exports = { JobExecutor };
