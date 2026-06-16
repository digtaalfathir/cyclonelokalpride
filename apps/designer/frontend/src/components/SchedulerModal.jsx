import React, { useState, useEffect } from 'react';
import { SkeletonTable } from './Skeleton';

const api = window.electronAPI || null;

const DAY_LABELS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function computeScheduleLabel({ scheduleType, config }) {
  const tz = config.timezone ? ` (${config.timezone})` : '';
  switch (scheduleType) {
    case 'ONCE':   return `Once — ${config.datetime || '?'}`;
    case 'HOURLY': return `Every ${config.interval || 1}h`;
    case 'DAILY':  return `Daily at ${config.time || '?'}${tz}`;
    case 'WEEKLY': return `${DAY_LABELS[config.dayOfWeek ?? 1]} at ${config.time || '?'}${tz}`;
    case 'CRON':   return `Cron: ${config.expression || '?'}${tz}`;
    default: return scheduleType;
  }
}

// Lazy list of IANA timezones — only needed when user opens timezone dropdown
let _tzList = null;
function getTzList() {
  if (_tzList) return _tzList;
  try { _tzList = Intl.supportedValuesOf('timeZone'); }
  catch { _tzList = []; }
  return _tzList;
}

function fmtNextRun(iso) {
  if (!iso) return '—';
  const d    = new Date(iso);
  const now  = new Date();
  const diff = d - now;
  if (diff < 0) return 'Overdue';
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Now';
  if (min < 60) return `in ${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `in ${h}h ${min % 60}m`;
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function StatusBadge({ status }) {
  const ok = status === 'ACTIVE';
  return (
    <span style={{
      padding: '2px 7px', borderRadius: 10, fontSize: 11, fontWeight: 600,
      background: ok ? '#DCFCE7' : '#F3F4F6', color: ok ? '#15803D' : '#6B7280',
    }}>{status}</span>
  );
}

const defaultConfig = () => ({ time: '07:00', interval: 1, dayOfWeek: 1, datetime: '', timezone: '', expression: '0 7 * * *' });

function ScheduleForm({ initial, publishedWorkflows, onSubmit, onCancel }) {
  const [form, setForm]           = useState(() => initial ? {
    name:            initial.name            || '',
    workflowId:      initial.workflowId      || '',
    workflowVersion: initial.workflowVersion || '',
    scheduleType:    initial.scheduleType    || 'DAILY',
    config:          { ...defaultConfig(), ...(initial.config || {}) },
  } : {
    name: '', workflowId: '', workflowVersion: '', scheduleType: 'DAILY', config: defaultConfig(),
  });
  const [versions, setVersions]             = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);

  useEffect(() => {
    if (!form.workflowId || !api) return;
    setLoadingVersions(true);
    api.listVersions(form.workflowId).then(r => {
      setVersions(r?.versions || []);
      setLoadingVersions(false);
    });
  }, [form.workflowId]);

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); }
  function setConfig(key, val) { setForm(f => ({ ...f, config: { ...f.config, [key]: val } })); }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.workflowId || !form.workflowVersion || !form.scheduleType) return;
    onSubmit({ ...form, workflowVersion: Number(form.workflowVersion) });
  }

  return (
    <form className="sched-form" onSubmit={handleSubmit}>

      <div className="sched-form__row">
        <label className="sched-form__label">Name <span className="hist-muted">(optional)</span></label>
        <input
          className="sched-form__input"
          type="text"
          placeholder={`e.g. Daily ${form.workflowId || 'import'}`}
          value={form.name}
          onChange={e => set('name', e.target.value)}
        />
      </div>

      <div className="sched-form__row">
        <label className="sched-form__label">Workflow *</label>
        <select
          className="sched-form__input"
          value={form.workflowId}
          onChange={e => set('workflowId', e.target.value) || set('workflowVersion', '')}
          required
        >
          <option value="">Select published workflow…</option>
          {publishedWorkflows.map(w => (
            <option key={w.workflowId} value={w.workflowId}>
              {w.workflowName || w.workflowId}
            </option>
          ))}
        </select>
      </div>

      {form.workflowId && (
        <div className="sched-form__row">
          <label className="sched-form__label">Version *</label>
          <select
            className="sched-form__input"
            value={form.workflowVersion}
            onChange={e => set('workflowVersion', e.target.value)}
            required
          >
            <option value="">{loadingVersions ? 'Loading…' : 'Select version…'}</option>
            {versions.map(v => (
              <option key={v.version} value={v.version}>
                v{v.version}{v.description ? ` — ${v.description}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="sched-form__row">
        <label className="sched-form__label">Schedule Type *</label>
        <div className="sched-form__type-group">
          {['ONCE','DAILY','HOURLY','WEEKLY','CRON'].map(t => (
            <label
              key={t}
              className={`sched-form__type-btn ${form.scheduleType === t ? 'sched-form__type-btn--active' : ''}`}
            >
              <input
                type="radio"
                name="scheduleType"
                value={t}
                checked={form.scheduleType === t}
                onChange={() => set('scheduleType', t)}
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
              />
              {t}
            </label>
          ))}
        </div>
      </div>

      {form.scheduleType === 'ONCE' && (
        <div className="sched-form__row">
          <label className="sched-form__label">Date &amp; Time *</label>
          <input
            className="sched-form__input sched-form__input--narrow"
            type="datetime-local"
            value={form.config.datetime}
            onChange={e => setConfig('datetime', e.target.value)}
            required
          />
        </div>
      )}

      {(form.scheduleType === 'DAILY' || form.scheduleType === 'WEEKLY') && (
        <div className="sched-form__row">
          <label className="sched-form__label">Time *</label>
          <input
            className="sched-form__input sched-form__input--narrow"
            type="time"
            value={form.config.time}
            onChange={e => setConfig('time', e.target.value)}
            required
          />
        </div>
      )}

      {form.scheduleType === 'WEEKLY' && (
        <div className="sched-form__row">
          <label className="sched-form__label">Day *</label>
          <select
            className="sched-form__input sched-form__input--narrow"
            value={form.config.dayOfWeek}
            onChange={e => setConfig('dayOfWeek', Number(e.target.value))}
          >
            {DAY_LABELS.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
        </div>
      )}

      {form.scheduleType === 'HOURLY' && (
        <div className="sched-form__row">
          <label className="sched-form__label">Every</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              className="sched-form__input sched-form__input--xnarrow"
              type="number"
              min={1} max={24}
              value={form.config.interval}
              onChange={e => setConfig('interval', Number(e.target.value))}
            />
            <span className="hist-muted" style={{ fontSize: 13 }}>hours</span>
          </div>
        </div>
      )}

      {form.scheduleType === 'CRON' && (
        <>
          <div className="sched-form__row">
            <label className="sched-form__label">Cron Expression *</label>
            <input
              className="sched-form__input"
              type="text"
              placeholder="minute hour dom month dow — e.g. 0 7 * * 1-5"
              value={form.config.expression}
              onChange={e => setConfig('expression', e.target.value)}
              required
            />
          </div>
          <div className="sched-cron-hint">
            Format: <code>minute hour day-of-month month day-of-week</code>
            &nbsp;— e.g. <code>0 9 * * 1</code> = every Monday 09:00
          </div>
        </>
      )}

      {(form.scheduleType === 'DAILY' || form.scheduleType === 'WEEKLY' || form.scheduleType === 'CRON') && (
        <div className="sched-form__row">
          <label className="sched-form__label">Timezone</label>
          <select
            className="sched-form__input"
            value={form.config.timezone || ''}
            onChange={e => setConfig('timezone', e.target.value)}
          >
            <option value="">Local machine time</option>
            {getTzList().map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>
      )}

      <div className="sched-form__actions">
        <button type="button" className="pub-dialog__btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="pub-dialog__btn pub-dialog__btn--primary">
          {initial?.id ? 'Save Changes' : 'Create Schedule'}
        </button>
      </div>

    </form>
  );
}

export default function SchedulerModal({ onClose }) {
  const [view, setView]           = useState('list');
  const [schedules, setSchedules] = useState([]);
  const [published, setPublished] = useState([]);
  const [editing, setEditing]     = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    if (!api) { setLoading(false); return; }
    const [sRes, wRes] = await Promise.all([
      api.listSchedules(),
      api.listPublished(),
    ]);
    setSchedules(sRes?.schedules || []);
    setPublished(wRes?.workflows || []);
    setLoading(false);
  }

  async function handleCreate(form) {
    if (!api) return;
    await api.createSchedule(form);
    setView('list');
    await loadData();
  }

  async function handleUpdate(form) {
    if (!api || !editing) return;
    await api.updateSchedule(editing.id, form);
    setView('list');
    setEditing(null);
    await loadData();
  }

  async function handleToggle(s) {
    if (!api) return;
    await api.toggleSchedule(s.id, s.status !== 'ACTIVE');
    await loadData();
  }

  async function handleDelete(s) {
    if (!api) return;
    if (!confirm(`Delete schedule "${s.name}"?`)) return;
    await api.deleteSchedule(s.id);
    await loadData();
  }

  function startEdit(s) {
    setEditing(s);
    setView('edit');
  }

  function backToList() {
    setView('list');
    setEditing(null);
  }

  const isForm = view === 'create' || view === 'edit';

  return (
    <div className="hist-overlay" onClick={onClose}>
      <div className="hist-dialog sched-dialog" onClick={e => e.stopPropagation()}>

        <div className="hist-header">
          <div>
            <div className="hist-header__title">
              {isForm ? (view === 'create' ? 'New Schedule' : 'Edit Schedule') : 'Task Scheduler'}
            </div>
            <div className="hist-header__sub">
              {isForm
                ? <button className="sched-back-btn" onClick={backToList}>← Back to list</button>
                : 'Manage scheduled workflow runs (published releases only)'
              }
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            {!isForm && (
              <button className="pub-dialog__btn pub-dialog__btn--primary" onClick={() => setView('create')}>
                + New Schedule
              </button>
            )}
            <button className="hist-close" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="hist-body">
          {loading ? (
            <SkeletonTable rows={4} cols={7} />

          ) : view === 'list' ? (
            schedules.length === 0 ? (
              <div className="hist-empty">
                No schedules yet.<br />
                Click <strong>+ New Schedule</strong> to create one.
              </div>
            ) : (
              <table className="hist-table">
                <thead>
                  <tr>
                    <th>Name</th><th>Workflow</th><th>Version</th>
                    <th>Schedule</th><th>Next Run</th><th>Last Run</th>
                    <th>Status</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map(s => (
                    <tr key={s.id}>
                      <td><strong>{s.name}</strong></td>
                      <td style={{ fontFamily: 'monospace', fontSize: 11.5 }}>{s.workflowId}</td>
                      <td>v{s.workflowVersion}</td>
                      <td>{computeScheduleLabel(s)}</td>
                      <td>{fmtNextRun(s.nextRunAt)}</td>
                      <td>{fmtDate(s.lastRunAt)}</td>
                      <td><StatusBadge status={s.status} /></td>
                      <td>
                        <div className="sched-actions">
                          <button className="hist-btn" onClick={() => startEdit(s)}>Edit</button>
                          <button className="hist-btn" onClick={() => handleToggle(s)}>
                            {s.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                          </button>
                          <button className="hist-btn hist-btn--danger" onClick={() => handleDelete(s)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )

          ) : view === 'create' ? (
            <ScheduleForm
              publishedWorkflows={published}
              onSubmit={handleCreate}
              onCancel={backToList}
            />

          ) : (
            <ScheduleForm
              initial={editing}
              publishedWorkflows={published}
              onSubmit={handleUpdate}
              onCancel={backToList}
            />
          )}
        </div>

      </div>
    </div>
  );
}
