"use client";

import * as React from 'react';
import JsBarcode from 'jsbarcode';

// EAN-13 quando o código é um EAN válido (13 dígitos, dígito verificador
// certo) — é o que vem impresso na embalagem e o leitor do caixa espera.
// Qualquer outro código cadastrado sai em Code 128, que aceita texto livre.
export function isValidEan13(code) {
  if (!/^\d{13}$/.test(code)) return false;
  const digits = code.split('').map(Number);
  const sum = digits.slice(0, 12).reduce((s, d, i) => s + d * (i % 2 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10 === digits[12];
}

export function barcodeFormat(code) {
  return isValidEan13(code) ? 'EAN13' : 'CODE128';
}

// Antes a etiqueta desenhava sempre o mesmo padrão fixo de barras — bonito
// na tela, ilegível pro leitor. Agora codifica o `barcode` do produto.
// Code 128 só codifica ASCII imprimível; fora disso não há o que desenhar.
const PRINTABLE_ASCII = /^[ -~]+$/;

export function LabelBarcode({ value, height = 18 }) {
  const ref = React.useRef(null);
  const encodable = Boolean(value) && PRINTABLE_ASCII.test(value);

  React.useEffect(() => {
    if (!ref.current || !encodable) return;
    JsBarcode(ref.current, value, {
      format: barcodeFormat(value), displayValue: false, height, width: 1, margin: 0, background: 'transparent', lineColor: '#16140F',
    });
  }, [value, height, encodable]);

  if (!value) return null;
  if (!encodable) {
    return <div style={{ fontSize: 7, color: '#B42318' }}>Código de barras com caractere inválido</div>;
  }
  return <svg ref={ref} role="img" aria-label={`Código de barras ${value}`} style={{ display: 'block' }} />;
}
