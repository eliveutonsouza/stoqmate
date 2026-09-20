"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { SettingsLayout } from '@/components/ui/settings-layout';
import { Toolbar } from '@/components/ui/toolbar';
import { I } from '@/components/icons';

export function AuditLog() {
  const navigate = useNavigate();
  const entries = [
    { time: '18/09 14:38', who: 'Lucas Prado', what: 'Registrou venda #4286', target: 'ELE-FONE-PR-128', kind: 'movement' },
    { time: '18/09 13:50', who: 'Ana Ribeiro', what: 'Registrou entrada NF 8421', target: 'VES-CPIM-BR-M', kind: 'movement' },
    { time: '18/09 11:04', who: 'Ana Ribeiro', what: 'Alterou preço de venda de R$ 279,90 para R$ 299,00', target: 'ELE-FONE-PR-128', kind: 'price' },
    { time: '18/09 10:45', who: 'Ana Ribeiro', what: 'Enviou transferência TRF-124 para Loja Campinas', target: 'CAS-TOAL-BE-ALG', kind: 'movement' },
    { time: '18/09 09:12', who: 'Mariana Souza', what: 'Adicionou atributo “Voltagem” à categoria Eletrônicos', target: 'Categoria · Eletrônicos', kind: 'schema' },
    { time: '17/09 18:14', who: 'Ana Ribeiro', what: 'Ajuste de inventário INV-05 · −2 un', target: 'ELE-FONE-PR-128', kind: 'adjust' },
    { time: '17/09 16:30', who: 'Mariana Souza', what: 'Convidou Diego Castro como Vendedor', target: 'Usuário · Diego Castro', kind: 'user' },
    { time: '17/09 15:02', who: 'Roberto Lima', what: 'Exportou relatório de lucratividade', target: 'lucratividade-set-2026.xlsx', kind: 'export' },
    { time: '16/09 09:41', who: 'Ana Ribeiro', what: 'Importou 1.270 produtos de planilha', target: 'catalogo-bonsucesso.xlsx', kind: 'import' },
    { time: '15/09 11:20', who: 'Mariana Souza', what: 'Alterou cor principal da marca para #E94B1C', target: 'Branding', kind: 'settings' },
    { time: '14/09 08:15', who: 'Ana Ribeiro', what: 'Criou local de estoque F-01', target: 'Local · F-01', kind: 'settings' },
    { time: '12/09 17:48', who: 'Mariana Souza', what: 'Criou promoção “Semana do Áudio” · −16,7%', target: 'Promoção', kind: 'promo' },
  ];
  const KIND = {
    movement: ['Movimentação', 'var(--info)', 'var(--info-soft)'],
    price: ['Preço', 'var(--warning)', 'var(--warning-soft)'],
    adjust: ['Ajuste', 'var(--danger)', 'var(--danger-soft)'],
    schema: ['Esquema', 'var(--accent-text)', 'var(--accent-soft)'],
    user: ['Usuário', 'var(--fg-muted)', 'var(--bg-sunken)'],
    export: ['Exportação', 'var(--fg-muted)', 'var(--bg-sunken)'],
    import: ['Importação', 'var(--success)', 'var(--success-soft)'],
    settings: ['Configuração', 'var(--fg-muted)', 'var(--bg-sunken)'],
    promo: ['Promoção', 'var(--accent-text)', 'var(--accent-soft)'],
  };

  return (
    <StoreShell route="/settings/audit" breadcrumb={['Configurações', 'Log de alterações']} navigate={navigate}>
      <PageHeader title="Configurações" sub="Identidade visual, dados da empresa, unidades, equipe e assinatura." />
      <SettingsLayout route="/settings/audit" navigate={navigate}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: 'var(--bg-elev)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
          {[
            { l: 'Registros · 30 dias', v: '1.418' },
            { l: 'Alterações de preço', v: '46' },
            { l: 'Ajustes de inventário', v: '21' },
            { l: 'Mudanças de esquema', v: '3' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '14px 16px', borderRight: i < 3 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{m.l}</div>
              <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', marginTop: 4 }}>{m.v}</div>
            </div>
          ))}
        </div>

        <Toolbar
          placeholder="Buscar por usuário, SKU ou ação…"
          filters={[{ label: 'Tipo', value: 'Todos' }, { label: 'Usuário', value: 'Todos' }, { label: 'Período', value: '30 dias' }]}
          right={<button className="btn btn-outline btn-sm"><I.Download size={12} /> Exportar log</button>}
        />

        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr><th style={{ width: 100 }}>Quando</th><th style={{ width: 130 }}>Quem</th><th style={{ width: 120 }}>Tipo</th><th>Ação</th><th>Alvo</th></tr>
            </thead>
            <tbody>
              {entries.map((e, i) => {
                const [label, color, soft] = KIND[e.kind];
                return (
                  <tr key={i}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{e.time}</td>
                    <td style={{ fontSize: 12, fontWeight: 500 }}>{e.who}</td>
                    <td><span style={{ padding: '2px 7px', borderRadius: 4, background: soft, color, fontSize: 11, fontWeight: 500 }}>{label}</span></td>
                    <td style={{ fontSize: 13 }}>{e.what}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{e.target}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ padding: '10px 18px', background: 'var(--bg-sunken)', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--fg-muted)', flex: 1 }}>Mostrando 12 de 1.418 · retenção de 24 meses no plano Controle</span>
            <button className="btn btn-ghost btn-sm">Anterior</button>
            <button className="btn btn-ghost btn-sm">Próxima <I.ChevronRight size={12} /></button>
          </div>
        </div>
      </SettingsLayout>
    </StoreShell>
  );
}

// === /settings/roles ===
