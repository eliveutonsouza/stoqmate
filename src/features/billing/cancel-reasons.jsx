"use client";


export const CANCEL_REASONS = [
  { id: 'price', l: 'Está caro para o momento da loja', offer: 'annual' },
  { id: 'unused', l: 'Não estou usando o suficiente', offer: 'onboarding' },
  { id: 'hard', l: 'É complicado de usar no dia a dia', offer: 'onboarding' },
  { id: 'missing', l: 'Falta um recurso que eu preciso', offer: 'feature' },
  { id: 'other_tool', l: 'Vou usar outro sistema', offer: 'pause' },
  { id: 'closing', l: 'A loja fechou ou parou de operar', offer: 'pause' },
  { id: 'other', l: 'Outro motivo', offer: 'pause' },
];
