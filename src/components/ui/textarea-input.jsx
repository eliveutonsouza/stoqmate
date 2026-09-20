"use client";


export function TextareaInput(p) {
  return <textarea className="input" {...p} style={{ height: 'auto', minHeight: 68, padding: '8px 10px', resize: 'vertical', lineHeight: 1.5, ...(p.style || {}) }} />;
}

// Card that wraps a form section
