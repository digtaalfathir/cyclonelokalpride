import React, { useState, useEffect, useCallback } from 'react';
import { IconX, IconSearch, IconAudit } from './Icons';

const ACTION_LABELS = {
  'workflow.publish': 'Publish Workflow',
  'workflow.run':     'Run Workflow',
  'schedule.create':  'Create Schedule',
  'schedule.update':  'Update Schedule',
  'schedule.delete':  'Delete Schedule',
  'schedule.toggle':  'Toggle Schedule',
  'report.export':    'Export Report',
};

export function AuditModal({ onClose }) {
  const [entries, setEntries]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter,  setFilter]    = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await window.electronAPI.listAudit({ limit: 500 });
      setEntries(res.entries || []);
    } catch (_) {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = filter
    ? entries.filter(e =>
        (e.action || '').includes(filter) ||
        (e.actor  || '').toLowerCase().includes(filter.toLowerCase()) ||
        JSON.stringify(e.details || {}).toLowerCase().includes(filter.toLowerCase())
      )
    : entries;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog audit-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title"><IconAudit /> Audit Log</span>
          <button className="modal-close" onClick={onClose}><IconX size={14} /></button>
        </div>

        <div className="audit-toolbar">
          <div className="audit-search">
            <IconSearch size={14} />
            <input
              type="text"
              placeholder="Filter by action, actor, details…"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="audit-search__input"
            />
          </div>
          <button className="toolbar__btn" onClick={load} title="Refresh">↻ Refresh</button>
        </div>

        <div className="audit-body">
          {loading ? (
            <div className="audit-empty">Loading…</div>
          ) : visible.length === 0 ? (
            <div className="audit-empty">No audit entries{filter ? ' matching filter' : ''}.</div>
          ) : (
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(e => (
                  <tr key={e.id}>
                    <td className="audit-time">{e.timestamp ? new Date(e.timestamp).toLocaleString() : '—'}</td>
                    <td><span className="audit-action">{ACTION_LABELS[e.action] || e.action}</span></td>
                    <td className="audit-actor">{e.actor || 'user'}</td>
                    <td className="audit-details">{Object.entries(e.details || {}).map(([k, v]) => (
                      <span key={k} className="audit-pill">{k}: {String(v)}</span>
                    ))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="modal-footer">
          <span className="audit-count">{visible.length} {visible.length === 1 ? 'entry' : 'entries'}</span>
          <button className="btn btn--secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
