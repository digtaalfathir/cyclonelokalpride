#!/usr/bin/env node
'use strict';

// RemoteRobotAgent — standalone agent that runs on remote machines.
// It connects to a Cyclone Controller via HTTP, polls for jobs, and
// executes them locally using the same WorkflowEngine.
//
// Usage:
//   node RemoteRobotAgent.js [options]
//
// Options (or equivalent env vars):
//   --controller  CONTROLLER_URL   Controller HTTP URL (e.g. http://192.168.1.10:3456)
//   --token       CONTROLLER_TOKEN Bearer token from Controller settings
//   --robot-id    ROBOT_ID         Unique ID for this robot (default: hostname)
//   --name        ROBOT_NAME       Human-readable name (default: hostname)
//   --poll        POLL_INTERVAL_MS Poll interval in ms (default: 3000)

const http     = require('http');
const https    = require('https');
const os       = require('os');
const path     = require('path');
const fs       = require('fs');

// We resolve WorkflowEngine relative to this file's location in the packaged app.
// Adjust if directory structure differs.
let WorkflowEngine;
try {
  ({ WorkflowEngine } = require('../shared/engine/workflowEngine'));
} catch {
  ({ WorkflowEngine } = require(path.join(__dirname, '..', '..', 'shared', 'engine', 'workflowEngine')));
}

// ── Parse CLI args ────────────────────────────────────────────
function arg(flag, envKey, def) {
  const idx = process.argv.indexOf(flag);
  return (idx !== -1 && process.argv[idx + 1]) || process.env[envKey] || def;
}

const CONTROLLER_URL = arg('--controller', 'CONTROLLER_URL', '');
const TOKEN          = arg('--token',      'CONTROLLER_TOKEN', '');
const ROBOT_ID       = arg('--robot-id',   'ROBOT_ID', `robot_${os.hostname()}`);
const ROBOT_NAME     = arg('--name',       'ROBOT_NAME', `${os.hostname()} (remote)`);
const POLL_MS        = Number(arg('--poll', 'POLL_INTERVAL_MS', '3000'));

if (!CONTROLLER_URL || !TOKEN) {
  console.error('Usage: node RemoteRobotAgent.js --controller <url> --token <token>');
  console.error('  or set CONTROLLER_URL and CONTROLLER_TOKEN environment variables.');
  process.exit(1);
}

const BASE = CONTROLLER_URL.replace(/\/$/, '');
const HEADERS = { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

// ── HTTP helpers ──────────────────────────────────────────────
function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url  = new URL(BASE + path);
    const lib  = url.protocol === 'https:' ? https : http;
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: url.hostname, port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search, method,
      headers: { ...HEADERS, ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) },
    };
    const req = lib.request(opts, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch { resolve({}); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ── Agent ─────────────────────────────────────────────────────
let busy = false;

function log(level, message) {
  const ts = new Date().toISOString().substring(11, 19);
  console.log(`[${ts}] [${level}] ${message}`);
}

async function heartbeat() {
  try {
    await request('POST', '/api/robots/heartbeat', {
      robotId: ROBOT_ID,
      name:    ROBOT_NAME,
      status:  busy ? 'BUSY' : 'ONLINE',
    });
  } catch (err) {
    log('WARN', `Heartbeat failed: ${err.message}`);
  }
}

async function poll() {
  if (busy) return;
  try {
    const res = await request('GET', `/api/jobs/next?robotId=${encodeURIComponent(ROBOT_ID)}`);
    if (res.job) await executeJob(res.job);
  } catch (err) {
    log('WARN', `Poll failed: ${err.message}`);
  }
}

async function executeJob(job) {
  busy = true;
  log('INFO', `Job ${job.id} — ${job.workflowId} — starting`);

  const logs    = [];
  const capture = (entry) => { logs.push(entry); log(entry.level, entry.message); };

  const engine = new WorkflowEngine();
  engine.on('log', capture);

  let result;
  try {
    const flowData = job.flowData || {};
    if (job.flowData?.breakpoints?.length) engine.setBreakpoints(job.flowData.breakpoints);
    result = await engine.execute(flowData);
  } catch (err) {
    result = { success: false, error: err.message };
  }

  try {
    await request('POST', '/api/jobs/complete', {
      jobId:   job.id,
      robotId: ROBOT_ID,
      success: result.success,
      error:   result.error || null,
      metrics: result.metrics || null,
      logs,
    });
  } catch (err) {
    log('ERROR', `Failed to report completion: ${err.message}`);
  }

  log(result.success ? 'SUCCESS' : 'ERROR', `Job ${job.id} ${result.success ? 'completed' : 'failed'}`);
  busy = false;
}

// ── Main ──────────────────────────────────────────────────────
log('INFO', `RemoteRobotAgent starting — controller: ${BASE}, id: ${ROBOT_ID}`);

heartbeat();
setInterval(heartbeat, 30_000);
setInterval(poll, POLL_MS);
