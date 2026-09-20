"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { HubCard } from '@/components/domain/hub-card';
import { exportCsvAction } from '@/features/tools/actions';

const CARDS = [
  { kind: 'catalog', i: <I.Box size={15} />, t: 'Catálogo completo', d: 'Todos os SKUs com categoria, fornecedor, local e preços.' },
  { kind: 'sales', i: <I.Chart size={15} />, t: 'Vendas dos últimos 30 dias', d: 'Uma linha por venda, com desconto, forma de pagamento e cliente.' },
  { kind: 'profit', i: <I.Credit size={15} />, t: 'Lucratividade', d: 'Compras vs. vendas por produto, com lucro bruto no período.' },
];
const SOON = [
  { i: <I.Activity size={15} />, t: 'Movimentações', d: 'Entradas, vendas, transferências, trocas, devoluções e ajustes.' },
  { i: <I.Truck size={15} />, t: 'Fornecedores e compras', d: 'Cadastro, condições comerciais e histórico de pedidos.' },
  { i: <I.Grid size={15} />, t: 'Folha de contagem', d: 'Planilha para inventário físico, com saldo do sistema oculto.' },
];

export function Exports() {
  const navigate = useNavigate();
  const [pendingKind, setPendingKind] = React.useState(null);
  const [error, setError] = React.useState('');

  const download = (kind) => {
    setError('');
    setPendingKind(kind);
    exportCsvAction(kind).then((result) => {
      setPendingKind(null);
      if (result?.error) { setError(result.error); return; }
      const blob = new Blob([`﻿${result.csv}`], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  return (
    <StoreShell route="/exports" breadcrumb={['Exportações']} navigate={navigate}>
      <PageHeader title="Exportações" sub="Gere um CSV agora com o dado atual — envio agendado por email chega numa próxima etapa" />
      <Page>
        {error && (
          <div style={{ padding: '10px 12px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 7, fontSize: 12 }}>{error}</div>
        )}
        <div>
          <div className="section-h"><h3>Exportar agora</h3></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {CARDS.map((c) => (
              <HubCard key={c.kind} icon={c.i} title={c.t} desc={pendingKind === c.kind ? 'Gerando…' : c.d} accent
                meta={[['Formato', 'CSV']]} onClick={() => download(c.kind)} />
            ))}
            {SOON.map((c) => (
              <div key={c.t} style={{ opacity: 0.5, cursor: 'not-allowed' }} title="Em breve">
                <HubCard icon={c.i} title={c.t} desc={c.d} meta={[['Formato', '—']]} onClick={() => {}} />
              </div>
            ))}
          </div>
        </div>
      </Page>
    </StoreShell>
  );
}
