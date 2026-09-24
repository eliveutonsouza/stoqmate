"use client";


export function Page({ children, gap = 16, width }) {
  return (
    <div className="page-pad" style={{ display: 'flex', flexDirection: 'column', gap, maxWidth: width, margin: width ? '0 auto' : undefined, minWidth: 0 }}>
      {children}
    </div>
  );
}

// === Form primitives ===
