import React, { useState, useCallback, useEffect } from 'react';
import { IconX, IconRobot } from './Icons';

const api = window.electronAPI || null;

// ── Shared helpers ────────────────────────────────────────────────────

const STATUS_STYLE = {
  PENDING:   { background: '#FEF3C7', color: '#92400E' },
  RUNNING:   { background: '#DBEAFE', color: '#1E40AF' },
  SUCCESS:   { background: '#D1FAE5', color: '#065F46' },
  FAILED:    { background: '#FEE2E2', color: '#991B1B' },
  CANCELLED: { background: '#F3F4F6', color: '#6B7280' },
  ONLINE:    { background: '#D1FAE5', color: '#065F46' },
  OFFLINE:   { background: '#F3F4F6', color: '#6B7280' },
  BUSY:      { background: '#FEF3C7', color: '#92400E' },
  ACTIVE:    { background: '#D1FAE5', color: '#065F46' },
  DISABLED:  { background: '#F3F4F6', color: '#6B7280' },
  MANUAL:    { background: '#EDE9FE', color: '#5B21B6' },
  SCHEDULED: { background: '#FFF7ED', color: '#C2410C' },
};

function Pill({ label }) {
  const style = STATUS_STYLE[label] || { background: '#F3F4F6', color: '#374151' };
  return (
    <span style={{ ...style, padding: '2px 7px', borderRadius: 99, fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  );
}

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
         d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtDuration(ms) {
  if (ms == null || ms < 0) return '—';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

function shortId(id) {
  if (!id) return '—';
  return id.length > 20 ? '…' + id.slice(-12) : id;
}

// ── Stat card ────────────────────────────────────────────────────────
function StatCard({ label, value, accent }) {
  return (
    <div className="dash-card">
      <div className="dash-card__value" style={{ color: accent }}>{value}</div>
      <div className="dash-card__label">{label}</div>
    </div>
  );
}

// ── Section wrapper ──────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="dash-section">
      <div className="dash-section__title">{title}</div>
      {children}
    </div>
  );
}

// ── Main modal ───────────────────────────────────────────────────────
export default function DashboardModal({ onClose }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await api?.getDashboard();
      if (r?.success) setData(r.data);
      else setError(r?.error || 'Failed to load dashboard data');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const robots  = data?.robots   || [];
  const jobs    = data?.jobs?.recent  || [];
  const summary = data?.jobs?.summary || {};
  const history = data?.history  || [];
  const wflows  = data?.workflows || [];
  const scheds  = data?.schedules || [];

  const onlineRobots   = robots.filter(r => r.status !== 'OFFLINE').length;
  const activeSchedules = scheds.filter(s => s.status === 'ACTIVE').length;

  return (
    <div className="hist-overlay" onClick={onClose}>
      <div className="dash-dialog" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="hist-header">
          <div className="hist-header__left">
            <span className="hist-title">Controller Dashboard</span>
            {data && (
              <span className="hist-muted" style={{ fontSize: 11, marginLeft: 10 }}>
                Updated {fmtTime(data.generatedAt)}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="hist-btn hist-btn--secondary" onClick={load} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
            <button className="hist-close" onClick={onClose}><IconX size={13} /></button>
          </div>
        </div>

        {/* Body */}
        <div className="dash-body">
          {loading && !data && (
            <div className="hist-empty">Loading system state…</div>
          )}
          {error && (
            <div className="hist-empty" style={{ color: '#DC2626' }}>{error}</div>
          )}

          {data && (
            <>
              {/* Overview cards */}
              <div className="dash-cards">
                <StatCard label="Published Workflows" value={wflows.length}    accent="#2563EB" />
                <StatCard label="Robots Online"       value={onlineRobots}     accent="#059669" />
                <StatCard label="Active Schedules"    value={activeSchedules}  accent="#D97706" />
                <StatCard label="Jobs Today"          value={summary.today ?? 0} accent="#7C3AED" />
              </div>

              {/* Job summary pills */}
              <div className="dash-job-summary">
                {[
                  ['PENDING',   summary.pending],
                  ['RUNNING',   summary.running],
                  ['SUCCESS',   summary.success],
                  ['FAILED',    summary.failed],
                  ['CANCELLED', summary.cancelled],
                ].map(([s, n]) => (
                  <span key={s} className="dash-job-pill">
                    <Pill label={s} /> <span className="dash-job-pill__n">{n ?? 0}</span>
                  </span>
                ))}
              </div>

              {/* Robots */}
              <Section title={`Robots (${robots.length})`}>
                {robots.length === 0 ? (
                  <p className="dash-empty-row">No robots registered.</p>
                ) : (
                  <table className="hist-table">
                    <thead>
                      <tr>
                        <th>Robot ID</th>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Last Seen</th>
                        <th>Capabilities</th>
                      </tr>
                    </thead>
                    <tbody>
                      {robots.map(r => (
                        <tr key={r.robotId}>
                          <td><code style={{ fontSize: 11 }}>{r.robotId}</code></td>
                          <td style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <IconRobot size={13} style={{ color: 'var(--text-muted)' }} />
                            {r.name}
                          </td>
                          <td><Pill label={r.status} /></td>
                          <td className="hist-muted">{fmtDate(r.lastSeen)}</td>
                          <td className="hist-muted">{(r.capabilities || []).join(', ') || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Section>

              {/* Published Workflows */}
              <Section title={`Workflows (${wflows.length})`}>
                {wflows.length === 0 ? (
                  <p className="dash-empty-row">No published workflows yet.</p>
                ) : (
                  <table className="hist-table">
                    <thead>
                      <tr>
                        <th>Workflow</th>
                        <th>Latest Version</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wflows.map(w => (
                        <tr key={w.workflowId}>
                          <td>{w.workflowName || w.workflowId}</td>
                          <td><span className="hist-version-badge">v{w.latestVersion}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Section>

              {/* Recent Jobs */}
              <Section title={`Recent Jobs (${jobs.length})`}>
                {jobs.length === 0 ? (
                  <p className="dash-empty-row">No jobs in queue.</p>
                ) : (
                  <table className="hist-table">
                    <thead>
                      <tr>
                        <th>Job ID</th>
                        <th>Workflow</th>
                        <th>Source</th>
                        <th>Status</th>
                        <th>Robot</th>
                        <th>Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map(j => (
                        <tr key={j.id}>
                          <td><code style={{ fontSize: 11 }}>{shortId(j.id)}</code></td>
                          <td>
                            {j.workflowId}
                            {j.workflowVersion != null && (
                              <span className="hist-version-badge" style={{ marginLeft: 5 }}>v{j.workflowVersion}</span>
                            )}
                          </td>
                          <td><Pill label={j.source} /></td>
                          <td><Pill label={j.status} /></td>
                          <td className="hist-muted">{j.robotId || '—'}</td>
                          <td className="hist-muted">{fmtDate(j.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Section>

              {/* Recent Run History */}
              <Section title="Recent Executions (last 10)">
                {history.length === 0 ? (
                  <p className="dash-empty-row">No execution history yet.</p>
                ) : (
                  <table className="hist-table">
                    <thead>
                      <tr>
                        <th>Run ID</th>
                        <th>Workflow</th>
                        <th>Source</th>
                        <th>Status</th>
                        <th>Duration</th>
                        <th>Start Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map(r => (
                        <tr key={r.runId}>
                          <td><code style={{ fontSize: 11 }}>{shortId(r.runId)}</code></td>
                          <td>
                            {r.workflowName || r.workflowId}
                            {r.workflowVersion != null && (
                              <span className="hist-version-badge" style={{ marginLeft: 5 }}>v{r.workflowVersion}</span>
                            )}
                          </td>
                          <td><Pill label={r.executionSource || 'MANUAL'} /></td>
                          <td><Pill label={r.status} /></td>
                          <td className="hist-muted">{fmtDuration(r.duration)}</td>
                          <td className="hist-muted">{fmtDate(r.startTime)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
