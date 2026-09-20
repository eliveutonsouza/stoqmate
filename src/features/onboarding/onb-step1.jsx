"use client";

import { OnbTitle } from '@/features/onboarding/onb-title';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';

export function OnbStep1({ data, set }) {
  return (
    <>
      <OnbTitle title="Como sua loja se chama?" desc="Esse nome aparece no painel, nos relatórios e no endereço da sua loja no sistema." />
      <Field label="Nome da loja ou rede" required hint="Mínimo 3 caracteres. Você adiciona as outras unidades depois.">
        <TextInput value={data.name} onChange={(e) => set('name', e.target.value)} placeholder="Bonsucesso Varejo" style={{ height: 40, fontSize: 15 }} />
      </Field>
      <div style={{
        marginTop: 18, padding: '12px 14px',
        background: 'var(--bg-sunken)', border: '1px solid var(--line)', borderRadius: 8,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>Seu endereço será</span>
        <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg)' }}>
          {(data.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'sualoja').substring(0, 20)}.stoqmate.com.br
        </code>
      </div>
    </>
  );
}
