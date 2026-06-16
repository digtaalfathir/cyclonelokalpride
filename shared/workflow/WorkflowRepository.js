'use strict';

const fs   = require('fs');
const path = require('path');

class WorkflowRepository {
  constructor({ releasesDir }) {
    this.releasesDir = releasesDir;
    this._ensureDir(releasesDir);
  }

  _ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  // ── Publish ──────────────────────────────────────────────────
  publish(workflowId, flowData, description) {
    const existing = this.listVersions(workflowId);
    const version  = existing.length ? Math.max(...existing.map(v => v.version)) + 1 : 1;

    const release = {
      workflowId,
      workflowName: flowData.name || workflowId,
      version,
      publishDate: new Date().toISOString(),
      description: description || '',
      nodes:    flowData.nodes    || [],
      edges:    flowData.edges    || [],
      viewport: flowData.viewport || {},
    };

    const filename = `${workflowId}_v${version}.release.json`;
    fs.writeFileSync(path.join(this.releasesDir, filename), JSON.stringify(release, null, 2), 'utf-8');

    return { workflowId, version, filename };
  }

  // ── List versions for a given workflowId ────────────────────
  listVersions(workflowId) {
    const prefix = `${workflowId}_v`;
    return fs.readdirSync(this.releasesDir)
      .filter(f => f.startsWith(prefix) && f.endsWith('.release.json'))
      .map(f => {
        try {
          const raw  = fs.readFileSync(path.join(this.releasesDir, f), 'utf-8');
          const data = JSON.parse(raw);
          return {
            workflowId:   data.workflowId,
            workflowName: data.workflowName,
            version:      data.version,
            publishDate:  data.publishDate,
            description:  data.description,
            filename:     f,
          };
        } catch (_) { return null; }
      })
      .filter(Boolean)
      .sort((a, b) => b.version - a.version);
  }

  // ── Get a specific version ───────────────────────────────────
  getVersion(workflowId, version) {
    const filename = `${workflowId}_v${version}.release.json`;
    const filepath = path.join(this.releasesDir, filename);
    if (!fs.existsSync(filepath)) throw new Error(`Release not found: ${filename}`);
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  }

  // ── Get latest published version ─────────────────────────────
  getLatest(workflowId) {
    const versions = this.listVersions(workflowId);
    if (!versions.length) throw new Error(`No releases found for: ${workflowId}`);
    return this.getVersion(workflowId, versions[0].version);
  }

  // ── List all published workflows (one entry per workflowId) ─
  listPublished() {
    const map = {};
    for (const f of fs.readdirSync(this.releasesDir).filter(f => f.endsWith('.release.json'))) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(this.releasesDir, f), 'utf-8'));
        const id   = data.workflowId;
        if (!map[id] || data.version > map[id].latestVersion) {
          map[id] = { workflowId: id, workflowName: data.workflowName, latestVersion: data.version };
        }
      } catch (_) {}
    }
    return Object.values(map).sort((a, b) => a.workflowId.localeCompare(b.workflowId));
  }
}

module.exports = { WorkflowRepository };
