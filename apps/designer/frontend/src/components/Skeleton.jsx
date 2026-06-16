import React from 'react';

// Single skeleton line
export function SkeletonLine({ width = '100%', height = 14, style }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: 4, ...style }}
    />
  );
}

// Table row skeletons (for modals with data tables)
export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r} style={{ borderBottom: '1px solid #f1f5f9' }}>
            {Array.from({ length: cols }).map((_, c) => (
              <td key={c} style={{ padding: '10px 14px' }}>
                <SkeletonLine width={c === 0 ? '60%' : c === cols - 1 ? '40%' : '80%'} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Card skeletons (for robot cards etc.)
export function SkeletonCards({ count = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 18px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
          <SkeletonLine width={32} height={32} style={{ borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <SkeletonLine width="50%" />
            <SkeletonLine width="30%" height={10} />
          </div>
          <SkeletonLine width={60} height={20} style={{ borderRadius: 10 }} />
        </div>
      ))}
    </div>
  );
}
