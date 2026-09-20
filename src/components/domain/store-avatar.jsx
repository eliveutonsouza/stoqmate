"use client";


export function StoreAvatar({ name }) {
  const initials = name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  const hue = name.charCodeAt(0) * 37 % 360;
  return (
    <div style={{
      width: 26, height: 26, borderRadius: 5,
      background: `oklch(70% 0.08 ${hue})`,
      color: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 10, fontWeight: 600,
      fontFamily: 'var(--font-mono)',
      flexShrink: 0,
    }}>{initials}</div>
  );
}
