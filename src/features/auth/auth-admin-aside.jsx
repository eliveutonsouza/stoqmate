"use client";


// Lateral do login do console. Regras de acesso que o banco aplica de fato
// (is_platform_staff, has_platform_role, fn_start_impersonation) — sem
// painel de status: não há monitor por trás que o alimente.
const RULES = [
  ['Só equipe Stoqmate', 'Nenhum perfil de loja alcança o console.'],
  ['Verificação em duas etapas', 'Sem o segundo fator, a sessão não tem acesso de equipe.'],
  ['Papel define o que se altera', 'Planos e configurações globais: super admin. Redes: super admin e suporte.'],
  ['Acesso a rede de cliente é auditado', 'Exige motivo e fica registrado no log de auditoria da rede.'],
];

export function AuthAdminAside() {
  return (
    <div style={{ maxWidth: 400, width: '100%' }}>
      <div style={{ fontSize: 11, color: 'var(--fg-soft)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
        Console da plataforma
      </div>
      {RULES.map(([t, d]) => (
        <div key={t} style={{ padding: '11px 0', borderBottom: '1px solid var(--line)' }}>
          <div style={{ fontSize: 13 }}>{t}</div>
          <div style={{ fontSize: 11.5, color: 'var(--fg-muted)', marginTop: 2, lineHeight: 1.5 }}>{d}</div>
        </div>
      ))}
    </div>
  );
}
