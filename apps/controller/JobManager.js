'use strict';

// JobManager — job lifecycle management on top of JobQueue.
// Adds cancel and retry semantics that JobQueue doesn't have natively.

class JobManager {
  constructor({ jobQueue }) {
    this._q = jobQueue;
  }

  createJob({ workflowId, workflowVersion, source, flowData, metadata }) {
    return this._q.createJob({ workflowId, workflowVersion, source, flowData, metadata });
  }

  // Mark a PENDING or RUNNING job as CANCELLED.
  // Returns { cancelled, wasRunning } — caller handles stopping the robot when wasRunning.
  cancelJob(jobId) {
    const job = this._q.getJob(jobId);
    if (!job) return { cancelled: false, reason: 'not_found' };
    if (!['PENDING', 'RUNNING'].includes(job.status)) {
      return { cancelled: false, reason: 'invalid_status', status: job.status };
    }
    this._q.updateJob(jobId, {
      status:      'CANCELLED',
      completedAt: new Date().toISOString(),
      error:       'Cancelled by user',
    });
    return { cancelled: true, wasRunning: job.status === 'RUNNING' };
  }

  // Clone a FAILED or CANCELLED job into a new PENDING job.
  retryJob(jobId) {
    const original = this._q.getJob(jobId);
    if (!original) return null;
    if (!['FAILED', 'CANCELLED'].includes(original.status)) return null;
    return this._q.createJob({
      workflowId:      original.workflowId,
      workflowVersion: original.workflowVersion,
      source:          original.source,
      flowData:        original.flowData || null,
      metadata:        { ...(original.metadata || {}), retriedFrom: jobId },
    });
  }

  listJobs(options) { return this._q.listJobs(options); }
  getJob(id)        { return this._q.getJob(id); }
}

module.exports = { JobManager };
