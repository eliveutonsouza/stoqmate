"use client";

import { PHONE_W } from '@/features/mobile/phone-w';
import { PHONE_SCALE } from '@/features/mobile/phone-scale';
import { PHONE_H } from '@/features/mobile/phone-h';
import { IOSDevice } from '@/features/mobile/ios-device';
import { useMediaQuery } from '@/hooks/use-media-query';

// No desktop é uma prévia com moldura de iPhone. Num celular de verdade a
// moldura some e a tela ocupa o aparelho — "celular dentro do celular" não
// serve pra ninguém. O conteúdo usa var(--phone-pad) no lugar do recuo fixo
// da barra de status da moldura.
export function PhoneFrame({ children }) {
  const onPhone = useMediaQuery('(max-width: 640px)');

  if (onPhone) {
    return (
      <div style={{
        '--phone-pad': '20px 16px 24px', '--phone-top': '8px',
        minHeight: 'calc(100dvh - 52px)', display: 'flex', flexDirection: 'column',
        background: '#16140F', color: '#F6F3EC',
      }}>
        <div className="phone-full">{children}</div>
      </div>
    );
  }

  return (
    <div style={{
      width: PHONE_W * PHONE_SCALE,
      height: PHONE_H * PHONE_SCALE,
      flexShrink: 0,
}}>
      <div style={{
        transform: `scale(${PHONE_SCALE})`, transformOrigin: 'top left',
        width: PHONE_W, height: PHONE_H,
        borderRadius: 48,
        boxShadow: '0 0 0 1.5px rgba(255,255,255,0.18), 0 18px 44px rgba(20,18,13,0.28)',
      }}>
        <IOSDevice dark>{children}</IOSDevice>
      </div>
    </div>
  );
}
