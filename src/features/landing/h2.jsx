"use client";


export function H2({ children, max = 760 }) {
  return (
    <h2 className="lp-h2" style={{
      margin: 0, fontWeight: 600, letterSpacing: '-0.032em',
      lineHeight: 1.12, maxWidth: max, textWrap: 'pretty',
    }}>{children}</h2>
  );
}
