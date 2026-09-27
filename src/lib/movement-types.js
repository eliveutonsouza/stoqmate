import { I } from '@/components/icons';
import { MOVEMENT_LABELS as L } from '@/lib/movement-labels';

export const MOVEMENT_TYPES = {
  sale: { label: L.sale, color: 'var(--info)', soft: 'var(--info-soft)', icon: <I.ArrowDown size={11} /> },
  entry: { label: L.entry, color: 'var(--success)', soft: 'var(--success-soft)', icon: <I.ArrowUp size={11} /> },
  return: { label: L.return, color: 'var(--warning)', soft: 'var(--warning-soft)', icon: <I.ArrowUp size={11} /> },
  exchange: { label: L.exchange, color: 'var(--fg-muted)', soft: 'var(--bg-sunken)', icon: <I.ArrowRight size={11} /> },
  transfer: { label: L.transfer, color: 'var(--accent-text)', soft: 'var(--accent-soft)', icon: <I.Swap size={11} /> },
  adjustment: { label: L.adjustment, color: 'var(--danger)', soft: 'var(--danger-soft)', icon: <I.Activity size={11} /> },
  count: { label: L.count, color: 'var(--fg-muted)', soft: 'var(--bg-sunken)', icon: <I.Grid size={11} /> },
};
