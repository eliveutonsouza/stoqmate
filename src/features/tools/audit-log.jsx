"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { SettingsLayout } from '@/components/ui/settings-layout';

const KIND = {
  price: ['Preço', 'var(--warning)', 'var(--warning-soft)'],
  schema: ['Esquema', 'var(--accent-text)', 'var(--accent-soft)'],
  user: ['Usuário', 'var(--fg-muted)', 'var(--bg-sunken)'],
  export: ['Exportação', 'var(--fg-muted)', 'var(--bg-sunken)'],
  import: ['Importação', 'var(--success)', 'var(--success-soft)'],
  settings: ['Configuração', 'var(--fg-muted)', 'var(--bg-sunken)'],
  promo: ['Promoção', 'var(--accent-text)', 'var(--accent-soft)'],
  supplier: ['Fornecedor', 'var(--info)', 'var(--info-soft)'],
};

export function AuditLog({ entries }) {
  const navigate = useNavigate();
  const priceCount = entries.filter((e) => e.kind === 'price').length;
  const schemaCount = entries.filter((e) => e.kind === 'schema').length;

  return (
    <StoreShell route="/settings/audit" breadcrumb={['Configurações', 'Log de alterações']} navigate={navigate}>
      <PageHeader title="Configurações" sub="Identidade visual, dados da empresa, unidades, equipe e assinatura." />
      <SettingsLayout route="/settings/audit" navigate={navigate}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
          {[
            { l: 'Registros', v: `${entries.length}` },
            { l: 'Alterações de preço', v: `${priceCount}` },
            { l: 'Mudanças de esquema', v: `${schemaCount}` },
          ].map((m, i) => (
            <div key={i} style={{ padding: '14px 16px', borderRight: i < 2 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{m.v}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          {entries.length === 0 ? (
            <div style={{ padding: '32px 18px', textAlign: 'center', fontSize: 13, color: 'var(--fg-muted)' }}>Nenhum registro de auditoria ainda.</div>
          ) : (
            <table className="table">
              <thead>
                <tr><th style={{ width: 140 }}>Quando</th><th style={{ width: 130 }}>Quem</th><th style={{ width: 120 }}>Tipo</th><th>Ação</th></tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const [label, color, soft] = KIND[e.kind] ?? ['Outro', 'var(--fg-muted)', 'var(--bg-sunken)'];
                  return (
                    <tr key={e.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>
                        {new Date(e.created_at).toLocaleDateString('pt-BR')} {new Date(e.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ fontSize: 12, fontWeight: 500 }}>{e.who}</td>
                      <td><span style={{ padding: '2px 7px', borderRadius: 4, background: soft, color, fontSize: 11, fontWeight: 500 }}>{label}</span></td>
                      <td style={{ fontSize: 13 }}>{e.message}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </SettingsLayout>
    </StoreShell>
  );
}
