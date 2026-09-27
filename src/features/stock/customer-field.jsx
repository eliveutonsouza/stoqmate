"use client";

import * as React from 'react';
import { I } from '@/components/icons';
import { TextInput } from '@/components/ui/text-input';
import { brl } from '@/lib/format';
import { searchCustomersAction } from '@/features/pos/actions';

// Cliente do atendimento (venda, troca, devolução): busca por nome, CPF/CNPJ, telefone ou email. Lista
// inline (não flutuante) pra não ser cortada pelo overflow do FormCard.
export function CustomerField({ customer, onChange }) {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState([]);
  const [status, setStatus] = React.useState('idle');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    let cancelled = false;
    const handle = setTimeout(async () => {
      setStatus('loading');
      const res = await searchCustomersAction(q).catch(() => ({ error: 'Não foi possível buscar clientes agora.' }));
      if (cancelled) return;
      if (res.error) { setError(res.error); setResults([]); setStatus('error'); return; }
      setError(''); setResults(res.rows); setStatus('done');
    }, 250);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [query]);

  if (customer) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', border: '1px solid var(--line-strong)', borderRadius: 6, background: 'var(--bg-elev)' }}>
        <I.Users size={13} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{customer.name}</div>
          {(customer.doc || customer.phone) && <div style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{customer.doc || customer.phone}</div>}
          {Number(customer.credit_balance) > 0 && <div style={{ fontSize: 11, color: 'var(--success)' }}>Crédito na loja: {brl(customer.credit_balance)}</div>}
        </div>
        <button type="button" onClick={() => onChange(null)} className="btn btn-ghost btn-sm">Trocar</button>
      </div>
    );
  }

  const q = query.trim();
  return (
    <div>
      <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Consumidor final — ou busque por nome, CPF/CNPJ ou telefone" />
      {q.length >= 2 && (
        <div style={{ marginTop: 6, border: '1px solid var(--line)', borderRadius: 7, overflow: 'hidden' }}>
          {status === 'loading' && <div style={{ padding: '8px 11px', fontSize: 12, color: 'var(--fg-muted)' }}>Buscando…</div>}
          {status === 'error' && <div role="alert" style={{ padding: '8px 11px', fontSize: 12, color: 'var(--danger)' }}>{error}</div>}
          {status === 'done' && results.length === 0 && (
            <div style={{ padding: '8px 11px', fontSize: 12, color: 'var(--fg-muted)' }}>Nenhum cliente encontrado. Cadastre em Clientes.</div>
          )}
          {status === 'done' && results.map((c) => (
            <button key={c.id} type="button" onClick={() => { onChange(c); setQuery(''); setResults([]); setStatus('idle'); }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 11px', background: 'transparent', borderBottom: '1px solid var(--line-soft)' }}>
              <div style={{ fontSize: 12.5, fontWeight: 500 }}>{c.name}</div>
              {(c.doc || c.phone) && <div style={{ fontSize: 10.5, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{c.doc || c.phone}</div>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
