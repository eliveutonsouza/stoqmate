"use client";

import * as React from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { StoreShell } from '@/components/ui/store-shell';
import { PageHeader } from '@/components/layout/page-header';
import { SettingsLayout } from '@/components/ui/settings-layout';
import { FormCard } from '@/components/ui/form-card';
import { updateFiscalModeAction } from '@/features/settings/actions';

const MODES = [
  ['now', 'Sim, quero emitir NFC-e no balcão', 'Precisa de um emissor homologado integrado — ainda não disponível no produto. Ao ativar, você entra numa lista de espera.'],
  ['own', 'Já emito por outro sistema', 'O Stoqmate cuida do estoque e da venda; a nota continua saindo onde sai hoje.'],
  ['later', 'Depois — quero organizar o estoque primeiro', 'A venda é registrada e o estoque baixa normalmente. Sem emissão fiscal por enquanto.'],
];

export function SettingsFiscal({ fiscalMode }) {
  const navigate = useNavigate();
  const [mode, setMode] = React.useState(fiscalMode);
  const [error, setError] = React.useState('');
  const [saved, setSaved] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const save = () => {
    setError(''); setSaved(false);
    startTransition(async () => {
      const result = await updateFiscalModeAction(mode);
      if (result?.error) { setError(result.error); return; }
      setSaved(true);
    });
  };

  return (
    <StoreShell route="/settings/fiscal" breadcrumb={['Configurações', 'Fiscal']} navigate={navigate}>
      <PageHeader title="Emissão fiscal" sub="O Stoqmate não emite nota por conta própria — integra com um emissor homologado quando essa integração estiver disponível." />
      <SettingsLayout route="/settings/fiscal" navigate={navigate}>
        <FormCard title="Sua situação atual" cols={1}
          footer={<button onClick={save} disabled={pending || mode === fiscalMode} className="btn btn-primary">{pending ? 'Salvando…' : 'Salvar'}</button>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {MODES.map(([k, title, desc]) => (
              <button key={k} onClick={() => setMode(k)} style={{
                display: 'flex', alignItems: 'flex-start', gap: 13, textAlign: 'left', width: '100%',
                padding: '15px 17px', borderRadius: 10,
                background: mode === k ? 'var(--accent-soft)' : 'var(--bg-elev)',
                border: '1px solid ' + (mode === k ? 'var(--accent)' : 'var(--line)'),
              }}>
                <span style={{
                  width: 17, height: 17, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                  border: '2px solid ' + (mode === k ? 'var(--accent)' : 'var(--line-strong)'),
                  background: mode === k ? 'var(--accent)' : 'transparent',
                  boxShadow: mode === k ? 'inset 0 0 0 3px var(--bg-elev)' : 'none',
                }} />
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 500 }}>{title}</div>
                  <div style={{ fontSize: 13, color: 'var(--fg-muted)', marginTop: 3, lineHeight: 1.5 }}>{desc}</div>
                </div>
              </button>
            ))}
          </div>
          {error && <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 10 }}>{error}</div>}
          {saved && <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 10 }}>Preferência salva.</div>}
        </FormCard>
      </SettingsLayout>
    </StoreShell>
  );
}
