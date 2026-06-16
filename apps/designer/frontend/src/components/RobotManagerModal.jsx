import React, { useState, useEffect, useCallback } from 'react';
import { IconX, IconRobotNetwork, IconRobot } from './Icons';

const STATUS_COLOR = { ONLINE: '#22c55e', BUSY: '#f59e0b', OFFLINE: '#6b7280' };

export function RobotManagerModal({ onClose }) {
  const [robots,  setRobots]  = useState([]);
  const [apiInfo, setApiInfo] = useState(null);
  const [copied,  setCopied]  = useState('');
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    const [rRes, aRes] = await Promise.all([
      window.electronAPI.listRobots(),
      window.electronAPI.getRobotApiInfo(),
    ]);
    setRobots(rRes.robots || []);
    if (aRes.success) setApiInfo(aRes);
  }, []);

  useEffect(() => { load(); }, [load]);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  const toggleApi = async () => {
    if (!apiInfo) return;
    setToggling(true);
    const newEnabled = !apiInfo.enabled;
    await window.electronAPI.saveSettings({ robotApi: { enabled: newEnabled } });
    await load();
    setToggling(false);
  };

  const connectionUrl = apiInfo
    ? `http://${apiInfo.ips?.[0] || '127.0.0.1'}:${apiInfo.port}`
    : '';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog robot-mgr-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title"><IconRobotNetwork /> Robot Manager</span>
          <button className="modal-close" onClick={onClose}><IconX size={14} /></button>
        </div>

        <div className="robot-mgr-body">
          {/* Robot API panel */}
          <div className="robot-api-panel">
            <div className="robot-api-panel__header">
              <span className="robot-api-panel__title">Remote Robot API</span>
              <label className="toggle-switch">
                <input type="checkbox" checked={!!apiInfo?.enabled} onChange={toggleApi} disabled={toggling} />
                <span className="toggle-switch__track" />
              </label>
            </div>

            {apiInfo?.enabled ? (
              <div className="robot-api-info">
                <div className="robot-api-row">
                  <span className="robot-api-label">Controller URL</span>
                  <code className="robot-api-value">{connectionUrl}</code>
                  <button className="copy-btn" onClick={() => copyToClipboard(connectionUrl, 'url')}>
                    {copied === 'url' ? '✓' : 'Copy'}
                  </button>
                </div>
                <div className="robot-api-row">
                  <span className="robot-api-label">Bearer Token</span>
                  <code className="robot-api-value robot-api-value--token">{apiInfo.token}</code>
                  <button className="copy-btn" onClick={() => copyToClipboard(apiInfo.token, 'token')}>
                    {copied === 'token' ? '✓' : 'Copy'}
                  </button>
                </div>
                <div className="robot-api-hint">
                  On remote machine: <code>node RemoteRobotAgent.js --controller {connectionUrl} --token {apiInfo.token?.slice(0, 8)}…</code>
                </div>
                {apiInfo.ips?.length > 1 && (
                  <div className="robot-api-ips">
                    All IPs: {apiInfo.ips.join(', ')}
                  </div>
                )}
              </div>
            ) : (
              <p className="robot-api-disabled-hint">
                Enable Robot API so remote machines can connect to this Controller via HTTP.
              </p>
            )}
          </div>

          {/* Robot list */}
          <div className="robot-list-section">
            <div className="robot-list-header">
              <span>Connected Robots ({robots.length})</span>
              <button className="toolbar__btn" onClick={load} title="Refresh">↻ Refresh</button>
            </div>
            {robots.length === 0 ? (
              <div className="audit-empty">No robots registered.</div>
            ) : (
              <div className="robot-list">
                {robots.map(r => (
                  <div key={r.id} className="robot-card">
                    <div className="robot-card__icon"><IconRobot size={20} /></div>
                    <div className="robot-card__info">
                      <span className="robot-card__name">{r.name || r.id}</span>
                      <span className="robot-card__id">{r.id}</span>
                      {r.lastHeartbeat && (
                        <span className="robot-card__heartbeat">
                          Last seen: {new Date(r.lastHeartbeat).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    <div
                      className="robot-card__status"
                      style={{ color: STATUS_COLOR[r.status] || STATUS_COLOR.OFFLINE }}
                    >
                      ● {r.status || 'OFFLINE'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn--secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
