"use client";


export function Page({ children, gap = 16, width }) {
  return (
    <div style={{ padding: '20px 28px 48px', display: 'flex', flexDirection: 'column', gap, maxWidth: width, margin: width ? '0 auto' : undefined }}>
      {children}
    </div>
  );
}

// === Form primitives ===
