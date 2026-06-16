import React from 'react';
import { IconX } from './Icons';

export function AboutModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog about-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">About</span>
          <button className="modal-close" onClick={onClose}><IconX size={14} /></button>
        </div>
        <div className="about-body">
          <div className="about-logo">
            <svg viewBox="0 0 48 48" fill="none" width="48" height="48">
              <rect width="48" height="48" rx="10" fill="#2563EB"/>
              <path d="M13 26V22C13 17.6 16 15 20 15C22.4 15 24.4 16 25.6 17.4L23.2 19.8C22.4 18.8 21.3 18.2 20 18.2C17.6 18.2 16.2 19.8 16.2 22V26C16.2 28.2 17.6 29.8 20 29.8C21.3 29.8 22.4 29.2 23.2 28.2L25.6 30.6C24.4 32 22.4 33 20 33C16 33 13 30.4 13 26Z" fill="white"/>
              <path d="M29 15H32L27 23V33H23.8V23L19 15H22L25 20.8L29 15Z" fill="white"/>
            </svg>
          </div>
          <div className="about-product">
            <span className="about-brand">Stechoq</span>
            <span className="about-name">Cyclone Studio</span>
            <span className="about-version">Version 1.0.0</span>
          </div>
          <p className="about-desc">
            Visual RPA Workflow Designer & Automation Engine.<br />
            Build, schedule, and monitor automation workflows.
          </p>
          <div className="about-meta">
            <div className="about-meta__row">
              <span>Platform</span>
              <strong>Electron 28 + React 18</strong>
            </div>
            <div className="about-meta__row">
              <span>Author</span>
              <strong>Stechoq / LokalPride</strong>
            </div>
            <div className="about-meta__row">
              <span>License</span>
              <strong>MIT</strong>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn--secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
