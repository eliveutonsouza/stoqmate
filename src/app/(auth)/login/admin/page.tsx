import { LoginAdmin } from '@/features/auth/login-admin';

// Renderizada por request: o proxy manda CSP com nonce nesta tela de
// credencial, e página estática sairia sem o nonce nos <script>.
export const dynamic = "force-dynamic";

export default function Page() {
  return <LoginAdmin />;
}
