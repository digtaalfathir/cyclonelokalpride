import React, { useState, useRef, useCallback } from 'react';

// Usage:
//   <Tooltip text="Run workflow" shortcut="F5">
//     <button>Run</button>
//   </Tooltip>
export function Tooltip({ text, shortcut, children, placement = 'bottom' }) {
  const [visible, setVisible] = useState(false);
  const [pos,     setPos]     = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const timerRef   = useRef(null);

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const top  = placement === 'bottom' ? rect.bottom + 6 : rect.top - 6;
      setPos({ top, left: rect.left + rect.width / 2 });
      setVisible(true);
    }, 320);
  }, [placement]);

  const hide = useCallback(() => {
    clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  return (
    <>
      <span ref={triggerRef} onMouseEnter={show} onMouseLeave={hide} style={{ display: 'contents' }}>
        {children}
      </span>
      {visible && (
        <div
          className={`tooltip tooltip--${placement}`}
          style={{ top: pos.top, left: pos.left }}
        >
          <span className="tooltip__text">{text}</span>
          {shortcut && <kbd className="tooltip__kbd">{shortcut}</kbd>}
        </div>
      )}
    </>
  );
}
