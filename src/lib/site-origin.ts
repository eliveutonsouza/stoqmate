import { headers } from "next/headers";

// Origens em que este app legitimamente roda. Produção sempre em primeiro:
// é o fallback quando o host da requisição não bate com nenhuma.
// Ao comprar o domínio próprio, adicionar aqui (e na allow-list de Redirect
// URLs do Supabase, que é a segunda barreira, não a primeira).
const KNOWN_ORIGINS = [
  "https://stoqmate.vercel.app",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

function originFromHost(host: string | null) {
  if (!host) return null;
  const proto = host === "localhost" || host.startsWith("localhost:") || host.startsWith("127.0.0.1") ? "http" : "https";
  return `${proto}://${host}`;
}

// Origem derivada do header `host`. Serve pra redirect pós-checkout do Stripe,
// onde o pior caso de um host forjado é o próprio atacante ser redirecionado
// de volta pra si mesmo — nada sensível viaja na URL.
export async function siteOrigin() {
  const h = await headers();
  return originFromHost(h.get("host")) ?? KNOWN_ORIGINS[0];
}

// Origem para links que chegam por email do Supabase Auth (reset de senha,
// convite, confirmação). Esses links carregam token de sessão, então o host
// da requisição NÃO é confiável: um `Host` forjado mandaria o token pro
// domínio do atacante. Só origem conhecida passa; qualquer outra cai em
// produção. A allow-list de Redirect URLs do Supabase continua valendo por
// baixo, mas como segunda barreira — esta aqui é a primeira.
export async function authEmailOrigin() {
  const origin = await siteOrigin();
  return KNOWN_ORIGINS.includes(origin) ? origin : KNOWN_ORIGINS[0];
}
