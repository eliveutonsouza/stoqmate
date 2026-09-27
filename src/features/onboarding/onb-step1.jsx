"use client";

import { OnbTitle } from '@/features/onboarding/onb-title';
import { Field } from '@/components/ui/field';
import { TextInput } from '@/components/ui/text-input';

// Sem prévia de "sualoja.stoqmate.com.br": o app não serve endereço por
// rede (o subdomain é só identificador interno).
export function OnbStep1({ data, set }) {
  return (
    <>
      <OnbTitle title="Como sua loja se chama?" desc="Esse nome aparece no painel e nos relatórios." />
      <Field label="Nome da loja ou rede" required hint="Mínimo 3 caracteres. Você adiciona as outras unidades depois.">
        <TextInput value={data.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex.: Loja Centro" style={{ height: 40, fontSize: 15 }} />
      </Field>
    </>
  );
}
