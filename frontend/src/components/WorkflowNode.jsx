import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { getNodeDefinition } from '../nodeDefinitions';
import {
  IconGlobe, IconLink, IconType, IconMousePointer,
  IconPlay, IconStopSquare, IconCheck, IconX, IconSpinner,
  IconVariable, IconClock, IconAPI, IconLog,
  IconCondition, IconLoop, IconShield,
  IconWaitUrl, IconWaitEl, IconWaitLoad,
  IconGetUrl, IconGetText, IconExists,
} from './Icons';

function NodeIcon({ iconKey, size = 15 }) {
  switch (iconKey) {
    case 'globe':    return <IconGlobe size={size} />;
    case 'link':     return <IconLink size={size} />;
    case 'type':     return <IconType size={size} />;
    case 'mouse':    return <IconMousePointer size={size} />;
    case 'play':     return <IconPlay size={size} />;
    case 'stop':     return <IconStopSquare size={size} />;
    case 'variable':   return <IconVariable size={size} />;
    case 'clock':      return <IconClock size={size} />;
    case 'api':        return <IconAPI size={size} />;
    case 'log':        return <IconLog size={size} />;
    case 'condition':  return <IconCondition size={size} />;
    case 'loop':       return <IconLoop size={size} />;
    case 'shield':     return <IconShield size={size} />;
    case 'waitUrl':    return <IconWaitUrl size={size} />;
    case 'waitEl':     return <IconWaitEl size={size} />;
    case 'waitLoad':   return <IconWaitLoad size={size} />;
    case 'getUrl':     return <IconGetUrl size={size} />;
    case 'getText':    return <IconGetText size={size} />;
    case 'exists':     return <IconExists size={size} />;
    default:           return <span style={{ fontSize: size * 0.85 }}>•</span>;
  }
}

function StatusBadge({ status }) {
  if (!status) return null;

  if (status === 'running') {
    return (
      <div className="workflow-node__status workflow-node__status--running">
        <IconSpinner size={11} />
      </div>
    );
  }
  if (status === 'completed') {
    return (
      <div className="workflow-node__status workflow-node__status--completed">
        <IconCheck size={10} />
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="workflow-node__status workflow-node__status--error">
        <IconX size={9} />
      </div>
    );
  }
  return null;
}

function WorkflowNode({ data, selected }) {
  const def = getNodeDefinition(data.nodeType);
  if (!def) return null;

  const status = data.status || '';

  let subtitle = '';
  if (data.nodeType === 'navigateUrl' && data.url) subtitle = data.url;
  else if (data.nodeType === 'inputText' && data.selector) subtitle = data.selector;
  else if (data.nodeType === 'clickElement' && data.selector) subtitle = data.selector;

  const nodeColor = def.color;

  return (
    <div
      className={`workflow-node ${selected ? 'selected' : ''} ${status}`}
      style={{ '--node-color': nodeColor }}
    >
      {def.hasInput && (
        <Handle type="target" position={Position.Top} style={{ top: -5 }} />
      )}

      <StatusBadge status={status} />

      <div className="workflow-node__body">
        <div
          className="workflow-node__icon"
          style={{
            background: `${nodeColor}18`,
            color: nodeColor,
          }}
        >
          <NodeIcon iconKey={def.iconKey} size={14} />
        </div>
        <div className="workflow-node__text">
          <div className="workflow-node__title">{data.label || def.label}</div>
          {subtitle && (
            <div className="workflow-node__subtitle" title={subtitle}>
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {def.outputHandles ? (
        <>
          <div className="workflow-node__handle-labels">
            {def.outputHandles.map(h => (
              <div
                key={h.id}
                className="workflow-node__handle-label"
                style={{ color: h.color }}
              >
                {h.label}
              </div>
            ))}
          </div>
          {def.outputHandles.map((h, i) => (
            <Handle
              key={h.id}
              type="source"
              position={Position.Bottom}
              id={h.id}
              style={{
                bottom: -5,
                left: `${(i + 1) / (def.outputHandles.length + 1) * 100}%`,
                background: h.color,
                borderColor: h.color,
                width: 10,
                height: 10,
              }}
            />
          ))}
        </>
      ) : def.hasOutput && (
        <Handle type="source" position={Position.Bottom} style={{ bottom: -5 }} />
      )}
    </div>
  );
}

export default memo(WorkflowNode);
