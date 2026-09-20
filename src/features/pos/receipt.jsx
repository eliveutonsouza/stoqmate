"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { I } from '@/components/icons';
import { brl } from '@/lib/format';

export function Receipt() {
  const navigate = useNavigate();
  const items = [
    { name: 'Fone Bluetooth ANC', variant: 'Preto · 128 GB', qty: 1, price: 299.00 },
    { name: 'Caderno Pautado 200f', variant: 'Preto · A4', qty: 12, price: 34.00, off: 10 },
    { name: 'Café em Grãos', variant: 'Intenso · 1 kg', qty: 3, price: 60.00 },
  ];
  const gross = items.reduce((s, i) => s + i.qty * i.price, 0);
  const off = items.reduce((s, i) => s + i.qty * i.price * ((i.off || 0) / 100), 0);
  const net = gross - off;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-sunken)', padding: '32px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'var(--success-soft)', color: 'var(--success)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}><I.Check size={18} stroke={2.4} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.015em' }}>Venda #4287 registrada</div>
            <div style={{ fontSize: 12.5, color: 'var(--fg-muted)', marginTop: 2 }}>
              {brl(net)} em cartão de crédito 3× · estoque de 3 SKUs atualizado
            </div>
          </div>
          <button className="btn btn-outline btn-sm"><I.Download size={13} /> PDF</button>
          <button className="btn btn-outline btn-sm">Enviar por email</button>
          <button onClick={() => navigate('/pos')} className="btn btn-primary btn-sm">Próximo atendimento</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
          {/* 80mm thermal receipt */}
          <div style={{
            background: '#fff', color: '#16140F',
            padding: '20px 18px', borderRadius: 4,
            boxShadow: 'var(--shadow-md)',
            fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1.55,
          }}>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.02em' }}>BONSUCESSO VAREJO</div>
              <div style={{ fontSize: 10, marginTop: 3 }}>Loja Centro</div>
              <div style={{ fontSize: 9.5, color: '#5C574F', marginTop: 2 }}>Av. Brig. Faria Lima, 2232 — Loja 14</div>
              <div style={{ fontSize: 9.5, color: '#5C574F' }}>CNPJ 24.531.908/0001-72</div>
            </div>
            <div style={{ borderTop: '1px dashed #B8B2A4', borderBottom: '1px dashed #B8B2A4', padding: '7px 0', fontSize: 9.5, color: '#5C574F' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>VENDA</span><span>#4287</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>18/09/2026</span><span>14:38</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>OPERADOR</span><span>LUCAS P.</span></div>
            </div>
            <div style={{ padding: '10px 0' }}>
              {items.map((it, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 500 }}>{it.name.toUpperCase()}</div>
                  <div style={{ fontSize: 9.5, color: '#5C574F' }}>{it.variant}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5 }}>
                    <span>{it.qty} × {it.price.toFixed(2).replace('.', ',')}{it.off ? ` (-${it.off}%)` : ''}</span>
                    <span>{(it.qty * it.price * (1 - (it.off || 0) / 100)).toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px dashed #B8B2A4', paddingTop: 8, fontSize: 10.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>SUBTOTAL</span><span>{gross.toFixed(2).replace('.', ',')}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>DESCONTOS</span><span>-{off.toFixed(2).replace('.', ',')}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, marginTop: 6, paddingTop: 6, borderTop: '1px solid #16140F' }}>
                <span>TOTAL</span><span>{net.toFixed(2).replace('.', ',')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10 }}>
                <span>CARTÃO CRÉDITO 3x</span><span>{net.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: 14, fontSize: 9, color: '#5C574F', lineHeight: 1.6 }}>
              TROCAS EM ATÉ 30 DIAS COM ESTE CUPOM<br/>
              NÃO É DOCUMENTO FISCAL
            </div>
            <div style={{ display: 'flex', gap: 1, height: 28, alignItems: 'flex-end', marginTop: 12, justifyContent: 'center' }}>
              {[2,1,1,3,1,2,1,1,2,3,1,1,2,1,3,1,2,1,1,2,3,1,2,1,1,3,1,2,2,1,3,1].map((w, i) => (
                <div key={i} style={{ width: w, height: '100%', background: i % 2 ? 'transparent' : '#16140F' }}></div>
              ))}
            </div>
            <div style={{ textAlign: 'center', fontSize: 9, marginTop: 4, letterSpacing: '0.08em' }}>4287 18092026</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 12 }}>O que aconteceu</div>
              {[
                ['Estoque baixado', '3 SKUs · 16 unidades em Loja Centro'],
                ['Movimentações criadas', '1 venda com 3 linhas · ref #4287'],
                ['Caixa', '+ R$ 0,00 em dinheiro (pago em cartão)'],
                ['Alertas disparados', 'Caderno Pautado A4 entrou em alerta de mínimo'],
              ].map(([k, v], i, arr) => (
                <div key={k} style={{ display: 'flex', gap: 12, padding: '9px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                  <span style={{ fontSize: 12, color: 'var(--fg-muted)', width: 150, flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: 12.5 }}>{v}</span>
                </div>
              ))}
            </div>

            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 12 }}>Próximos passos</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                <button onClick={() => navigate('/pos')} className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start', width: '100%' }}>
                  <I.Plus size={12} /> Iniciar próximo atendimento
                </button>
                <button onClick={() => navigate('/stock/movement')} className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start', width: '100%' }}>
                  <I.Activity size={12} /> Ver a movimentação no histórico
                </button>
                <button onClick={() => navigate('/customers')} className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start', width: '100%' }}>
                  <I.Users size={12} /> Vincular a um cliente
                </button>
                <button onClick={() => navigate('/cash')} className="btn btn-outline btn-sm" style={{ justifyContent: 'flex-start', width: '100%' }}>
                  <I.Credit size={12} /> Conferir caixa do turno
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
