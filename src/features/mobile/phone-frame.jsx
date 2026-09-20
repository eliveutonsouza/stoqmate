"use client";

import { PHONE_W } from '@/features/mobile/phone-w';
import { PHONE_SCALE } from '@/features/mobile/phone-scale';
import { PHONE_H } from '@/features/mobile/phone-h';
import { IOSDevice } from '@/features/mobile/ios-device';

export function PhoneFrame({ children }) {
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
