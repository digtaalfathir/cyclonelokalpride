import React, { useState, useEffect } from 'react';
import { IconX, IconBell, IconSettings } from './Icons';

const TABS = ['Notifications', 'Robot API'];

export function SettingsModal({ onClose }) {
  const [tab,      setTab]      = useState(0);
  const [settings, setSettings] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  useEffect(() => {
    window.electronAPI.getSettings().then(res => {
      if (res.success) setSettings(res.settings);
    });
  }, []);

  if (!settings) return null;

  const notif  = settings.notifications;
  const rApi   = settings.robotApi;

  const patch = (path, value) => {
    const keys = path.split('.');
    setSettings(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    await window.electronAPI.saveSettings(settings);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog settings-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title"><IconSettings /> Settings</span>
          <button className="modal-close" onClick={onClose}><IconX size={14} /></button>
        </div>

        <div className="settings-tabs">
          {TABS.map((t, i) => (
            <button
              key={t}
              className={`settings-tab${tab === i ? ' settings-tab--active' : ''}`}
              onClick={() => setTab(i)}
            >{t}</button>
          ))}
        </div>

        <div className="settings-body">
          {tab === 0 && (
            <div className="settings-section">
              <h4 className="settings-section__title"><IconBell size={14} /> Desktop Notifications</h4>
              <label className="settings-row">
                <input type="checkbox" checked={!!notif.desktopOnSuccess} onChange={e => patch('notifications.desktopOnSuccess', e.target.checked)} />
                Notify on job success
              </label>
              <label className="settings-row">
                <input type="checkbox" checked={!!notif.desktopOnFailure} onChange={e => patch('notifications.desktopOnFailure', e.target.checked)} />
                Notify on job failure
              </label>

              <h4 className="settings-section__title" style={{ marginTop: 20 }}>Email Notifications</h4>
              <label className="settings-row">
                <input type="checkbox" checked={!!notif.emailEnabled} onChange={e => patch('notifications.emailEnabled', e.target.checked)} />
                Enable email notifications
              </label>
              {notif.emailEnabled && (
                <>
                  <label className="settings-row">
                    <input type="checkbox" checked={!!notif.emailOnSuccess} onChange={e => patch('notifications.emailOnSuccess', e.target.checked)} />
                    Email on success
                  </label>
                  <label className="settings-row">
                    <input type="checkbox" checked={!!notif.emailOnFailure} onChange={e => patch('notifications.emailOnFailure', e.target.checked)} />
                    Email on failure
                  </label>

                  <div className="settings-smtp">
                    <div className="settings-field">
                      <label>SMTP Host</label>
                      <input type="text" value={notif.smtp.host} onChange={e => patch('notifications.smtp.host', e.target.value)} placeholder="smtp.gmail.com" />
                    </div>
                    <div className="settings-field settings-field--short">
                      <label>Port</label>
                      <input type="number" value={notif.smtp.port} onChange={e => patch('notifications.smtp.port', Number(e.target.value))} />
                    </div>
                    <label className="settings-row">
                      <input type="checkbox" checked={!!notif.smtp.secure} onChange={e => patch('notifications.smtp.secure', e.target.checked)} />
                      SSL/TLS
                    </label>
                    <div className="settings-field">
                      <label>Username</label>
                      <input type="text" value={notif.smtp.user} onChange={e => patch('notifications.smtp.user', e.target.value)} placeholder="user@example.com" />
                    </div>
                    <div className="settings-field">
                      <label>Password</label>
                      <input type="password" value={notif.smtp.pass} onChange={e => patch('notifications.smtp.pass', e.target.value)} />
                    </div>
                    <div className="settings-field">
                      <label>Send To</label>
                      <input type="text" value={notif.smtp.to} onChange={e => patch('notifications.smtp.to', e.target.value)} placeholder="recipient@example.com" />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 1 && (
            <div className="settings-section">
              <h4 className="settings-section__title">Remote Robot API</h4>
              <label className="settings-row">
                <input type="checkbox" checked={!!rApi.enabled} onChange={e => patch('robotApi.enabled', e.target.checked)} />
                Enable Robot API Server
              </label>
              <div className="settings-field settings-field--short">
                <label>Port</label>
                <input type="number" value={rApi.port} onChange={e => patch('robotApi.port', Number(e.target.value))} min={1024} max={65535} />
              </div>
              <p className="settings-hint">
                Token is auto-generated. View in <strong>Robot Manager</strong> after saving.
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn--secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
