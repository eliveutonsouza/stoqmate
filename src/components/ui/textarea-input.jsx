"use client";

import { useFieldId } from '@/components/ui/field';

export function TextareaInput({ id, ...p }) {
  const textareaId = useFieldId(id);
  return <textarea className="input" id={textareaId} {...p} style={{ height: 'auto', minHeight: 68, padding: '8px 10px', resize: 'vertical', lineHeight: 1.5, ...(p.style || {}) }} />;
}

// Card that wraps a form section
