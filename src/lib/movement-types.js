import { I } from '@/components/icons';

export const MOVEMENT_TYPES = {
  sale: { label: 'Venda', color: 'var(--info)', soft: 'var(--info-soft)', icon: <I.ArrowDown size={11} /> },
  entry: { label: 'Entrada', color: 'var(--success)', soft: 'var(--success-soft)', icon: <I.ArrowUp size={11} /> },
  return: { label: 'Devolução', color: 'var(--warning)', soft: 'var(--warning-soft)', icon: <I.ArrowUp size={11} /> },
  exchange: { label: 'Troca', color: 'var(--fg-muted)', soft: 'var(--bg-sunken)', icon: <I.ArrowRight size={11} /> },
  transfer: { label: 'Transferência', color: 'var(--accent-text)', soft: 'var(--accent-soft)', icon: <I.Swap size={11} /> },
  adjustment: { label: 'Ajuste', color: 'var(--danger)', soft: 'var(--danger-soft)', icon: <I.Activity size={11} /> },
  count: { label: 'Contagem', color: 'var(--fg-muted)', soft: 'var(--bg-sunken)', icon: <I.Grid size={11} /> },
};
