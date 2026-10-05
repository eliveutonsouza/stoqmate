"use client";

import { useNavigate } from '@/hooks/use-navigate';
import { LayoutPublic } from '@/components/layout/layout-public';
import { SUPPORT_EMAIL } from '@/lib/support';

const UPDATED_AT = '5 de outubro de 2026';

// Quem responde pelo Stoqmate. Hoje é pessoa física (desenvolvedor); quando
// houver empresa, trocar por razão social + CNPJ aqui — os dois textos leem
// daqui.
const CONTROLLER = 'Eliveuton Souza, desenvolvedor responsável pelo Stoqmate';
// Mesmo prazo de fn_retention_days() no banco (purga automática diária).
const RETENTION_DAYS = 90;

function LegalLayout({ route, title, intro, sections }) {
  const navigate = useNavigate();
  return (
    <LayoutPublic navigate={navigate} route={route}>
      <article style={{ maxWidth: 760, margin: '0 auto', padding: '48px var(--page-pad) 24px', lineHeight: 1.65 }}>
        <h1 style={{ margin: 0, fontSize: 'clamp(26px, 5vw, 34px)', fontWeight: 600, letterSpacing: '-0.03em' }}>{title}</h1>
        <p style={{ margin: '8px 0 0', fontSize: 12.5, color: 'var(--fg-soft)' }}>Última atualização: {UPDATED_AT}</p>
        <p style={{ margin: '20px 0 0', fontSize: 15, color: 'var(--fg-muted)' }}>{intro}</p>
        {sections.map((s) => (
          <section key={s.h} style={{ marginTop: 28 }}>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>{s.h}</h2>
            {s.p.map((text, i) => (
              <p key={i} style={{ margin: '10px 0 0', fontSize: 14, color: 'var(--fg-muted)' }}>{text}</p>
            ))}
          </section>
        ))}
        <p style={{ marginTop: 32, fontSize: 14, color: 'var(--fg-muted)' }}>
          Dúvidas: <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: 'var(--accent-text)', fontWeight: 500 }}>{SUPPORT_EMAIL}</a>
        </p>
      </article>
    </LayoutPublic>
  );
}

const TERMS = [
  { h: '1. O serviço', p: [
    'O Stoqmate é um software, oferecido por assinatura, para controle de estoque, vendas no balcão, compras e relatórios de lojas de varejo, com recursos opcionais de inteligência artificial.',
    'Ao criar uma conta você declara ter poderes para contratar em nome da empresa (a "rede") cadastrada e concorda com estes termos e com a Política de privacidade.',
  ] },
  { h: '2. Conta e acesso', p: [
    'Cada pessoa usa o próprio login. Você é responsável por manter a senha em sigilo e pelos acessos que conceder à sua equipe, inclusive o perfil de cada um.',
    'Podemos suspender acessos usados de forma fraudulenta, abusiva ou que coloquem em risco a segurança do serviço ou de outros clientes.',
  ] },
  { h: '3. Período de teste, planos e cobrança', p: [
    'Novas contas começam com um período de teste gratuito, com a duração informada no cadastro. Ao final dele, o uso continua mediante assinatura de um dos planos publicados na página de planos.',
    'A cobrança é recorrente (mensal ou anual), feita pelo processador de pagamentos Stripe. Os limites de cada plano (lojas, usuários, produtos, créditos de IA) são os exibidos na página de planos no momento da contratação.',
    'Créditos de IA do plano renovam mensalmente e não acumulam. Pacotes avulsos de crédito são cobrados à parte e não geram cobrança automática de excedente.',
    'Você pode cancelar a qualquer momento em Configurações › Assinatura; o acesso segue até o fim do período já pago.',
  ] },
  { h: '4. Seus dados', p: [
    'Os dados que você cadastra (produtos, estoque, vendas, clientes, fornecedores) são seus. Nós os tratamos apenas para prestar o serviço, conforme a Política de privacidade.',
    `Você pode exportar seus dados em CSV a qualquer momento em Exportações. Após o cancelamento da assinatura ou o pedido de exclusão da conta, os dados ficam guardados por ${RETENTION_DAYS} dias — dá pra reativar a conta nesse prazo sem perder nada — e depois são excluídos definitivamente, junto com os arquivos enviados e os logins da equipe.`,
  ] },
  { h: '5. Inteligência artificial', p: [
    'Recursos de IA (leitura de nota fiscal, classificação, enriquecimento, previsão e perguntas sobre o estoque) geram sugestões. Toda sugestão é revisada e confirmada por você antes de alterar o seu estoque ou cadastro.',
  ] },
  { h: '6. Disponibilidade e responsabilidade', p: [
    'Trabalhamos para manter o serviço disponível e seguro, mas ele pode passar por manutenções ou falhas de terceiros. Não nos responsabilizamos por decisões comerciais tomadas com base nos relatórios e sugestões do sistema.',
  ] },
  { h: '7. Alterações', p: [
    'Podemos atualizar estes termos. Mudanças relevantes serão avisadas por email ou dentro do sistema com antecedência razoável.',
  ] },
];

const PRIVACY = [
  { h: '1. Quem trata os dados', p: [
    `O Stoqmate é desenvolvido e operado por ${CONTROLLER}, que é o controlador dos dados das contas (nome, email e telefone de quem usa o sistema) e operador dos dados que a sua loja cadastra (clientes, vendas, estoque), tratados em nome da sua empresa — para esses, a sua loja é a controladora.`,
    `Encarregado pelo tratamento de dados (LGPD, art. 41): Eliveuton Souza, pelo email ${SUPPORT_EMAIL}.`,
  ] },
  { h: '2. Dados que coletamos', p: [
    'Cadastro: nome, email, telefone, nome da loja e CNPJ (opcional).',
    'Uso: registros de acesso, ações feitas no sistema (log de auditoria) e dados técnicos necessários para segurança.',
    'Cobrança: os dados do cartão são coletados e guardados pelo Stripe; nós recebemos apenas o status da assinatura e das faturas.',
    'Conteúdo da loja: produtos, estoque, vendas, clientes, fornecedores e arquivos enviados (logo, fotos, notas fiscais para leitura por IA).',
  ] },
  { h: '3. Para que usamos', p: [
    'Prestar o serviço contratado, autenticar usuários, cobrar a assinatura, dar suporte, garantir a segurança e cumprir obrigações legais. Não vendemos dados pessoais.',
  ] },
  { h: '4. Bases legais (LGPD)', p: [
    'Execução de contrato (art. 7º, V) para operar a conta; cumprimento de obrigação legal (art. 7º, II) para registros fiscais e contábeis; legítimo interesse (art. 7º, IX) para segurança e prevenção a fraude; e consentimento quando solicitado.',
  ] },
  { h: '5. Com quem compartilhamos', p: [
    'Apenas com fornecedores necessários para o serviço funcionar: Supabase (banco de dados, autenticação e arquivos), Vercel (hospedagem da aplicação), Stripe (pagamentos), Resend (envio dos avisos por email), Google (somente se você entrar com a conta Google) e Anthropic (processamento dos recursos de IA, somente quando você usa um deles). Alguns desses fornecedores processam dados fora do Brasil, com salvaguardas contratuais.',
  ] },
  { h: '6. Por quanto tempo', p: [
    `Enquanto a conta estiver ativa. Após o cancelamento ou o pedido de exclusão (em Configurações › Dados da empresa), a conta fica suspensa por ${RETENTION_DAYS} dias e então os dados da loja, os arquivos enviados e os logins da equipe são excluídos automaticamente. Fica só um registro técnico de que a exclusão aconteceu (identificador e data), sem dado pessoal.`,
    'Os registros fiscais e contábeis da sua loja são de responsabilidade dela: exporte o que precisar guardar antes do fim do prazo.',
  ] },
  { h: '7. Seus direitos', p: [
    'Você pode pedir confirmação de tratamento, acesso, correção, portabilidade, anonimização ou exclusão dos seus dados, e revogar consentimentos. Parte disso está disponível direto no sistema (perfil, exportações e exclusão da conta em Configurações); o restante, pelo email abaixo, respondido em até 15 dias.',
    'Clientes da sua loja que pedirem correção ou exclusão dos próprios dados são atendidos pela loja: na ficha do cliente há "Editar cadastro" e "Anonimizar", e a exportação de clientes fica em Exportações.',
  ] },
  { h: '8. Segurança', p: [
    'Dados trafegam criptografados (HTTPS), cada loja só enxerga os próprios dados (isolamento por empresa no banco) e acessos da nossa equipe de suporte ficam registrados.',
  ] },
];

export function TermsPage() {
  return (
    <LegalLayout
      route="/terms"
      title="Termos de uso"
      intro="Estas são as regras de uso do Stoqmate. Leia com atenção: ao criar uma conta você concorda com elas."
      sections={TERMS}
    />
  );
}

export function PrivacyPage() {
  return (
    <LegalLayout
      route="/privacy"
      title="Política de privacidade"
      intro="Como o Stoqmate coleta, usa e protege dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018)."
      sections={PRIVACY}
    />
  );
}
