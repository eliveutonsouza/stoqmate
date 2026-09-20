"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { I } from '@/components/icons';
import { Page } from '@/components/ui/page-container';
import { HubCard } from '@/components/domain/hub-card';
import { FormCard } from '@/components/ui/form-card';

export function Exports() {
  const navigate = useNavigate();
  const history = [
    { name: 'movimentacoes-set-2026.xlsx', kind: 'Movimentações', by: 'Roberto Lima', when: '18 set 14:02', rows: 1142, size: '286 KB', status: 'ready' },
    { name: 'catalogo-completo.xlsx', kind: 'Catálogo', by: 'Ana Ribeiro', when: '16 set 09:41', rows: 1688, size: '412 KB', status: 'ready' },
    { name: 'lucratividade-set-2026.xlsx', kind: 'Lucratividade', by: 'Roberto Lima', when: '15 set 17:20', rows: 142, size: '48 KB', status: 'ready' },
    { name: 'inventario-a04.csv', kind: 'Folha de contagem', by: 'Ana Ribeiro', when: '14 set 08:15', rows: 62, size: '6 KB', status: 'expired' },
    { name: 'vendas-ago-2026.xlsx', kind: 'Vendas', by: 'Mariana Souza', when: '01 set 10:00', rows: 986, size: '224 KB', status: 'expired' },
  ];

  return (
    <StoreShell route="/exports" breadcrumb={['Exportações']} navigate={navigate}>
      <PageHeader
        title="Exportações"
        sub="Gere arquivos sob demanda ou agende envios recorrentes por email"
        actions={<button className="btn btn-primary btn-sm"><I.Download size={13} /> Nova exportação</button>}
      />
      <Page>
        <div>
          <div className="section-h"><h3>Exportar agora</h3></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { i: <I.Box size={15} />, t: 'Catálogo completo', d: 'Todos os SKUs com categoria, atributos, preços, saldo e local.', m: '1.688 linhas' },
              { i: <I.Activity size={15} />, t: 'Movimentações', d: 'Entradas, vendas, transferências, trocas, devoluções e ajustes.', m: '1.142 linhas' },
              { i: <I.Chart size={15} />, t: 'Vendas por período', d: 'Uma linha por venda, com desconto, vendedor e forma de pagamento.', m: '1.142 linhas' },
              { i: <I.Credit size={15} />, t: 'Lucratividade', d: 'Compras vs. vendas por produto, com lucro bruto e margem.', m: '142 linhas' },
              { i: <I.Truck size={15} />, t: 'Fornecedores e compras', d: 'Cadastro, condições comerciais e histórico de notas.', m: '6 + 24 linhas' },
              { i: <I.Grid size={15} />, t: 'Folha de contagem', d: 'Planilha para inventário físico, com saldo do sistema oculto.', m: 'por local' },
            ].map(c => (
              <HubCard key={c.t} icon={c.i} title={c.t} desc={c.d} accent meta={[['Volume', c.m]]} onClick={() => {}} />
            ))}
          </div>
        </div>

        <FormCard title="Exportações agendadas" desc="Enviadas por email nos dias e horários definidos." cols={1}
          footer={<><button className="btn btn-outline">Adicionar agendamento</button><button className="btn btn-primary">Salvar</button></>}>
          {[
            ['Vendas da semana', 'Toda segunda às 08:00 · para roberto@bonsucesso.com.br', true],
            ['Lucratividade mensal', 'Dia 1 às 08:00 · para mariana@bonsucesso.com.br', true],
            ['Itens em ruptura', 'Todo dia às 07:00 · para ana@bonsucesso.com.br', false],
            ['Catálogo completo', 'Dia 1 às 03:00 · backup para o Drive da rede', false],
          ].map(([t, d, on], i, arr) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{t}</div>
                <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>{d}</div>
              </div>
              {on ? <span className="badge badge-success"><span className="badge-dot"></span> Ativo</span> : <span className="badge">Pausado</span>}
              <button className="btn btn-ghost btn-icon btn-sm"><I.More size={13} /></button>
            </div>
          ))}
        </FormCard>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>Histórico</h3>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--fg-muted)' }}>Arquivos ficam disponíveis por 7 dias.</p>
          </div>
          <table className="table">
            <thead>
              <tr><th>Arquivo</th><th>Tipo</th><th>Gerado por</th><th>Quando</th><th className="num">Linhas</th><th className="num">Tamanho</th><th>Status</th><th style={{ width: 90 }}></th></tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.name} style={{ opacity: h.status === 'expired' ? 0.6 : 1 }}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>{h.name}</td>
                  <td style={{ fontSize: 12 }}>{h.kind}</td>
                  <td style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{h.by}</td>
                  <td style={{ fontSize: 12, color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>{h.when}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{h.rows.toLocaleString('pt-BR')}</td>
                  <td className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-muted)' }}>{h.size}</td>
                  <td>{h.status === 'ready' ? <span className="badge badge-success">Disponível</span> : <span className="badge">Expirado</span>}</td>
                  <td>
                    {h.status === 'ready'
                      ? <button className="btn btn-outline btn-sm"><I.Download size={11} /> Baixar</button>
                      : <button className="btn btn-ghost btn-sm">Gerar de novo</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Page>
    </StoreShell>
  );
}

// === /settings/audit ===
