import type { NextConfig } from "next";

// Headers de segurança fixos. A Content-Security-Policy é montada por
// request no proxy (src/lib/csp.ts): nonce no app autenticado.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  images: {
    // Mídia pública do Supabase Storage (central de ajuda) passa pelo
    // otimizador da Vercel: redimensiona pro tamanho exibido, converte pra
    // AVIF/WebP e fica em cache no CDN — o Storage sozinho é lento no 1º acesso.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
    formats: ["image/avif", "image/webp"],
    // Caminho versionado (help-media/v1/…): o conteúdo de uma URL não muda.
    minimumCacheTTL: 31536000,
  },
  experimental: {
    serverActions: {
      // Upload de foto/logo/nota passa por Server Action. Padrão é 1 MB; a
      // Vercel corta request em 4,5 MB, então 4 MB é o teto útil.
      bodySizeLimit: "4mb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
