import type { NextConfig } from "next";

// Headers de segurança que não dependem de nonce. CSP completo (script-src)
// fica de fora por enquanto: exige nonce por request no Next e quebraria os
// scripts inline do framework se feito pela metade.
const securityHeaders = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
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
