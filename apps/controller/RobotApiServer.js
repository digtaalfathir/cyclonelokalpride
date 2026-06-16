'use strict';

// RobotApiServer — lightweight HTTP server that lets remote robots
// register, poll for jobs, stream logs, and report completions.
//
// Protocol (all endpoints require: Authorization: Bearer <token>)
//   POST /api/robots/heartbeat  { robotId, name, status }
//   GET  /api/jobs/next         ?robotId=xxx
//   POST /api/jobs/complete     { jobId, robotId, success, error, metrics, logs[], runId }
//   GET  /api/health            (no auth — for connectivity check)

const http = require('http');

function ts() { return new Date().toISOString().substring(11, 19); }

class RobotApiServer {
  constructor({ jobQueue, execRepo, registry, token, onLog, onJobComplete }) {
    this._q          = jobQueue;
    this._execRepo   = execRepo;
    this._registry   = registry;
    this._token      = token;
    this._onLog      = onLog         || (() => {});
    this._onJobComplete = onJobComplete || (() => {});
    this._server     = null;
  }

  start(port) {
    this._server = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type');
      if (req.method === 'OPTIONS') return res.writeHead(204).end();

      // Health check — no auth
      if (req.method === 'GET' && req.url === '/api/health') {
        return this._json(res, 200, { ok: true, server: 'Cyclone RobotAPI' });
      }

      // Auth check
      if (req.headers.authorization !== `Bearer ${this._token}`) {
        return this._json(res, 401, { error: 'Unauthorized' });
      }

      const url = new URL(req.url, `http://localhost:${port}`);

      if (req.method === 'POST' && url.pathname === '/api/robots/heartbeat') return this._heartbeat(req, res);
      if (req.method === 'GET'  && url.pathname === '/api/jobs/next')         return this._nextJob(req, res, url);
      if (req.method === 'POST' && url.pathname === '/api/jobs/complete')     return this._complete(req, res);

      this._json(res, 404, { error: 'Not Found' });
    });

    this._server.on('error', err => {
      this._onLog({ level: 'ERROR', message: `[RobotAPI] Server error: ${err.message}`, timestamp: ts() });
    });

    this._server.listen(port, '0.0.0.0', () => {
      this._onLog({ level: 'INFO', message: `[RobotAPI] Listening on :${port}`, timestamp: ts() });
    });
  }

  stop() {
    this._server?.close(() => {
      this._onLog({ level: 'INFO', message: '[RobotAPI] Server stopped', timestamp: ts() });
    });
  }

  // ── Handlers ─────────────────────────────────────────────────
  async _heartbeat(req, res) {
    const body     = await this._readBody(req);
    const { robotId = 'remote_robot', name, status = 'ONLINE' } = JSON.parse(body);

    if (!this._registry.getRobot(robotId)) {
      this._registry.registerRobot(robotId, { name: name || robotId, capabilities: ['workflow'] });
      this._onLog({ level: 'INFO', message: `[RobotAPI] Remote robot registered: ${robotId}`, timestamp: ts() });
    }
    this._registry.updateHeartbeat(robotId, status);
    this._json(res, 200, { ok: true });
  }

  _nextJob(req, res, url) {
    const robotId = url.searchParams.get('robotId') || 'remote_robot';
    const job     = this._q.claimNextJob(robotId);
    this._json(res, 200, { job: job || null });
  }

  async _complete(req, res) {
    const body = await this._readBody(req);
    const { jobId, robotId, success, error: errMsg, metrics, logs = [], runId: existingRunId } = JSON.parse(body);

    if (!jobId) return this._json(res, 400, { error: 'jobId required' });

    // Forward logs to Designer
    for (const log of logs) {
      this._onLog(log);
    }

    // Finalize job record
    const now = new Date().toISOString();
    this._q.updateJob(jobId, {
      status:      success ? 'SUCCESS' : 'FAILED',
      completedAt: now,
      error:       errMsg || null,
    });

    // Update exec history if runId provided
    if (existingRunId) {
      try {
        this._execRepo.updateRun(existingRunId, {
          endTime: now,
          status:  success ? 'SUCCESS' : 'FAILED',
          error:   errMsg || null,
          ...(metrics ? { duration: metrics.endTime - metrics.startTime, nodesExecuted: metrics.nodesExecuted, nodesFailed: metrics.nodesFailed } : {}),
        });
      } catch (_) {}
    }

    this._onLog({ level: success ? 'SUCCESS' : 'ERROR',
      message: `[RobotAPI] Remote job ${jobId} ${success ? 'completed' : 'failed'}${errMsg ? ': ' + errMsg : ''}`,
      timestamp: ts() });

    // Notify ControllerService (resolves requestRun promise)
    this._onJobComplete(jobId, { success: !!success, error: errMsg, metrics, jobId, runId: existingRunId });

    this._json(res, 200, { ok: true });
  }

  // ── Helpers ──────────────────────────────────────────────────
  _json(res, code, obj) {
    const body = JSON.stringify(obj);
    res.writeHead(code, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
    res.end(body);
  }

  _readBody(req) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      req.on('data', c => chunks.push(c));
      req.on('end',  () => resolve(Buffer.concat(chunks).toString('utf-8') || '{}'));
      req.on('error', reject);
    });
  }
}

module.exports = { RobotApiServer };
