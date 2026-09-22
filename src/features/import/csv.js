// Parser CSV mínimo (sem dependência nova): lida com aspas, vírgula
// dentro de campo e quebra de linha dentro de campo. Não cobre todo RFC
// 4180 (ex.: delimitador custom), suficiente pro caso de uso real desta
// tela (exportação de planilha comum, separada por vírgula).
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((f) => f !== '')) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  if (rows.length === 0) return { headers: [], records: [] };

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const records = rows.slice(1).map((r) => Object.fromEntries(headers.map((h, i) => [h, (r[i] ?? '').trim()])));
  return { headers, records };
}

export const IMPORT_TEMPLATE_HEADERS = ['sku', 'barcode', 'category_code', 'brand', 'name', 'cost_price', 'sale_price', 'min_stock', 'initial_qty'];

export function buildTemplateCsv() {
  const example = ['ELE-FONE-PR-01', '7891234567890', 'ELE', 'Foneclear', 'Fone Bluetooth ANC', '158.00', '299.00', '10', '0'];
  return `${IMPORT_TEMPLATE_HEADERS.join(',')}\n${example.join(',')}\n`;
}
