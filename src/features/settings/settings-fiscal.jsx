"use client";

// Emissão fiscal via parceiro (NFC-e no balcão, NF-e na transferência).
//
// A decisão que este arquivo materializa: o Stoqmate NÃO emite nota por conta
// própria. Um emissor parceiro cuida de certificado, das regras de cada estado
// e da contingência quando a SEFAZ cai; nós cuidamos do estoque. Isso custa
// centavos por nota, aparece no custo variável e exige um passo a mais no
// onboarding — o certificado digital.

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { SettingsLayout } from '@/components/ui/settings-layout';
import { I } from '@/components/icons';
import { FormCard } from '@/components/ui/form-card';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';
import { SelectInput } from '@/components/ui/select-input';
import { brl } from '@/lib/format';

const FISCAL_PARTNERS = [
  { id: 'focus', name: 'Focus NFe', perNote: 0.09, note: 'Cobertura nacional, homologado em todos os estados.' },
  { id: 'enotas', name: 'eNotas', perNote: 0.12, note: 'Bom para quem também emite NFS-e de serviço.' },
  { id: 'tecnospeed', name: 'Tecnospeed', perNote: 0.08, note: 'Mais barato em volume alto, contrato anual.' },
];

export const FISCAL = {
  partner: 'focus',
  perNote: 0.09,                 // R$ por documento autorizado
  notesPerStoreMonth: 640,       // média de cupons por loja/mês no varejo de bairro
  get costPerStore() { return this.perNote * this.notesPerStoreMonth; },
};

export function SettingsFiscal() {
  const navigate = useNavigate();
  const [partner, setPartner] = React.useState('focus');
  const [mode, setMode] = React.useState('nfce');
  const p = FISCAL_PARTNERS.find(x => x.id === partner);

  return (
    <StoreShell route="/settings/fiscal" breadcrumb={['Configurações', 'Fiscal']} navigate={navigate}>
      <PageHeader
        title="Emissão fiscal"
        sub="Certificado, série e contingência. O Stoqmate manda os dados da venda; o emissor autoriza na SEFAZ."
        actions={<span className="badge badge-success"><span className="badge-dot"></span> Emitindo normalmente</span>}
      />
      <SettingsLayout route="/settings/fiscal" navigate={navigate}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
          {[
            ['Notas hoje', '84', 'todas autorizadas'],
            ['Este mês', '612', '2 rejeitadas, corrigidas'],
            ['Certificado vence em', '94 dias', '12 jan 2027', 'warn'],
            ['Custo do mês', brl(612 * FISCAL.perNote), `${brl(FISCAL.perNote)} por nota`],
          ].map(([l, v, s, tone]) => (
            <div key={l} className="card" style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 11.5, color: 'var(--fg-muted)' }}>{l}</div>
              <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--font-mono)', letterSpacing: '-0.028em', marginTop: 4, color: tone === 'warn' ? 'var(--warning)' : 'var(--fg)' }}>{v}</div>
              <div style={{ fontSize: 11.5, color: 'var(--fg-faint)', marginTop: 2 }}>{s}</div>
            </div>
          ))}
        </div>

        <FormCard title="Quem emite" desc="O Stoqmate não emite nota diretamente — integra com um emissor homologado. Trocar de emissor não muda nada na operação da loja." cols={1}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FISCAL_PARTNERS.map(o => (
              <button key={o.id} onClick={() => setPartner(o.id)} style={{
                display: 'flex', alignItems: 'center', gap: 13, textAlign: 'left',
                padding: '13px 15px', borderRadius: 8, background: partner === o.id ? 'var(--accent-soft)' : 'var(--bg-elev)',
                border: '1px solid ' + (partner === o.id ? 'var(--accent)' : 'var(--line)'), width: '100%',
              }}>
                <span style={{
                  width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                  border: '2px solid ' + (partner === o.id ? 'var(--accent)' : 'var(--line-strong)'),
                  background: partner === o.id ? 'var(--accent)' : 'transparent',
                  boxShadow: partner === o.id ? 'inset 0 0 0 3px var(--bg-elev)' : 'none',
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{o.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 2 }}>{o.note}</div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{brl(o.perNote)}<span style={{ fontSize: 11, color: 'var(--fg-muted)' }}> /nota</span></span>
              </button>
            ))}
          </div>
          <div style={{ padding: '11px 13px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 7, fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.55 }}>
            No seu volume atual de 612 notas por mês, o {p.name} sai por <strong style={{ color: 'var(--fg)', fontWeight: 500 }}>{brl(612 * p.perNote)}</strong> mensais.
            Repassamos o custo do emissor sem margem — está fora da mensalidade do plano.
          </div>
        </FormCard>

        <FormCard title="Certificado digital A1" desc="Arquivo .pfx emitido pela sua contabilidade. Fica criptografado e só é usado para assinar suas notas." cols={2}>
          <Field label="Certificado" span={2}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 15px', background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8 }}>
              <span style={{ color: 'var(--success)', display: 'flex' }}><I.Shield size={18} /></span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>bonsucesso-varejo-A1.pfx</div>
                <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>CNPJ 12.345.678/0001-90 · válido até 12 jan 2027</div>
              </div>
              <button className="btn btn-outline btn-sm">Substituir</button>
            </div>
          </Field>
          <Field label="Avisar sobre o vencimento" span={1} hint="Certificado vencido para a emissão na hora.">
            <SelectInput value="60, 30 e 7 dias antes" onChange={() => {}} options={['30 dias antes', '60, 30 e 7 dias antes', '90, 60, 30 e 7 dias antes']} />
          </Field>
          <Field label="Quem recebe o aviso" span={1}>
            <SelectInput value="Proprietário e Gestor Financeiro" onChange={() => {}} options={['Proprietário', 'Proprietário e Gestor Financeiro', 'Todos os gestores']} />
          </Field>
        </FormCard>

        <FormCard title="Documentos" desc="O que sai em cada operação." cols={2}>
          <Field label="Venda no balcão" span={1}>
            <div style={{ display: 'flex', gap: 2, padding: 3, background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 7 }}>
              {[{ k: 'nfce', l: 'NFC-e' }, { k: 'cfe', l: 'CF-e/SAT' }, { k: 'none', l: 'Não emitir' }].map(o => (
                <button key={o.k} onClick={() => setMode(o.k)} style={{
                  flex: 1, background: mode === o.k ? 'var(--bg-elev)' : 'transparent',
                  border: '1px solid ' + (mode === o.k ? 'var(--line)' : 'transparent'),
                  borderRadius: 5, padding: '6px 10px', fontSize: 12.5, fontWeight: 500,
                  color: mode === o.k ? 'var(--fg)' : 'var(--fg-muted)',
                }}>{o.l}</button>
              ))}
            </div>
          </Field>
          <Field label="Transferência entre unidades" span={1} hint="Mercadoria em trânsito entre CNPJs exige NF-e.">
            <SelectInput value="NF-e modelo 55" onChange={() => {}} options={['NF-e modelo 55', 'Não emitir (mesmo CNPJ)']} />
          </Field>
          <Field label="Série" span={1}><TextInput mono defaultValue="1" /></Field>
          <Field label="Próximo número" span={1}><TextInput mono defaultValue="8.421" /></Field>
          <Field label="Regime tributário" span={1}>
            <SelectInput value="Simples Nacional" onChange={() => {}} options={['Simples Nacional', 'Lucro Presumido', 'Lucro Real']} />
          </Field>
          <Field label="CSOSN padrão" span={1} hint="Aplicado a produtos sem tributação própria.">
            <TextInput mono defaultValue="102" />
          </Field>
        </FormCard>

        <FormCard title="Quando a SEFAZ cai" desc="Acontece. O que importa é a loja continuar vendendo." cols={1}
          footer={<button className="btn btn-primary">Salvar configuração</button>}>
          <Field label="Modo de contingência">
            <SelectInput value="Emitir offline e transmitir quando voltar" onChange={() => {}}
              options={['Emitir offline e transmitir quando voltar', 'Bloquear a venda até a SEFAZ voltar']} />
          </Field>
          <div style={{ padding: '11px 13px', background: 'var(--warning-soft)', border: '1px solid var(--warning)', borderRadius: 7, fontSize: 12, color: 'var(--fg)', lineHeight: 1.55 }}>
            Em contingência o cupom sai com aviso impresso e a transmissão acontece sozinha quando a conexão volta.
            A venda e a baixa de estoque nunca dependem da SEFAZ.
          </div>
        </FormCard>
      </SettingsLayout>
    </StoreShell>
  );
}
