"use client";


export function DonutChart({ segments, size = 130, thickness = 18, center }) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0);
  const withOffsets = segments.reduce((acc, s) => {
    const len = (s.value / total) * c;
    const offset = acc.length ? acc[acc.length - 1].offset + acc[acc.length - 1].len : 0;
    return [...acc, { ...s, len, offset }];
  }, []);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--bg-sunken)" strokeWidth={thickness} />
        {withOffsets.map((s, i) => (
          <circle
            key={i}
            cx={size/2} cy={size/2} r={r}
            fill="none" stroke={s.color} strokeWidth={thickness}
            strokeDasharray={`${s.len} ${c - s.len}`}
            strokeDashoffset={-s.offset}
            transform={`rotate(-90 ${size/2} ${size/2})`}
          />
        ))}
      </svg>
      {center && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {center}
        </div>
      )}
    </div>
  );
}
