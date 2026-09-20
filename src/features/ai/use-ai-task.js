import * as React from 'react';

export async function aiJSON({ system, prompt, max_tokens = 1400 }) {
  const raw = await window.claude.complete({
    system: (system || '') + '\nResponda SOMENTE com JSON válido, sem cercas de código, sem texto antes ou depois.',
    messages: [{ role: 'user', content: prompt }],
    max_tokens,
  });
  const text = String(raw || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = Math.min(...['{', '['].map(c => { const i = text.indexOf(c); return i < 0 ? Infinity : i; }));
  const slice = start === Infinity ? text : text.slice(start);
  return JSON.parse(slice);
}

// Hook that owns the three states every AI surface needs.

export function useAITask() {
  const [state, setState] = React.useState('idle');
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState(null);
  const run = async (fn) => {
    setState('running'); setError(null);
    try { setData(await fn()); setState('done'); }
    catch (e) { setError(String(e && e.message ? e.message : e)); setState('error'); }
  };
  const reset = () => { setState('idle'); setData(null); setError(null); };
  return { state, data, error, run, reset, setData };
}

// === Shared visual language for anything the model produced ===
