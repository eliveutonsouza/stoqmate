"use client";


export function MiniAreaChart({ data, height = 200, color = 'var(--accent)', showAxis = true }) {
  const max = Math.max(...data.map(d => d.v));
  const min = Math.min(...data.map(d => d.v));
  const w = 600;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - ((d.v - min) / (max - min || 1)) * (height - 24) - 12;
    return { x, y, ...d };
  });
  const pathD = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
  const fillD = `${pathD} L${w},${height} L0,${height} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id="gradArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {showAxis && [0.25, 0.5, 0.75].map(p => (
        <line key={p} x1="0" y1={height * p + 12} x2={w} y2={height * p + 12} stroke="var(--line-soft)" strokeDasharray="2 4" />
      ))}
      <path d={fillD} fill="url(#gradArea)" />
      <path d={pathD} stroke={color} strokeWidth="1.5" fill="none" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2" fill={color} opacity={i === points.length - 1 ? 1 : 0} />
      ))}
    </svg>
  );
}
