import { open, go, shot, cardOf, pick } from './cap.mjs';
import path from 'node:path';
const { browser, page } = await open('state-owner.json');
const T = (t) => page.getByText(t, { exact: false }).first();
const B = (n) => page.getByRole('button', { name: n }).first();
const L = (n) => page.getByLabel(n, { exact: false }).first();

// Cadastro de produto preenchido
await go(page, '/products/new');
await page.locator('button', { hasText: 'Vestuário' }).first().click(); await page.waitForTimeout(500);
await shot(page, 'produto-categoria', cardOf(page, 'Categoria'));
await L('Marca').fill('Pima Co.'); await L('Nome do produto').fill('Camiseta Gola V');
await L('Cor').selectOption({ label: 'Azul' }); await L('Tamanho').selectOption({ label: 'G' });
await L('Código de barras').fill('7891000300107');
await shot(page, 'produto-identificacao', cardOf(page, 'Identificação'));
await L('Preço de compra').fill('45,00'); await L('Preço de venda').fill('109,90'); await L('Estoque mínimo').fill('6');
await shot(page, 'produto-precos', cardOf(page, 'Preços e estoque'));
await L('Fornecedor').selectOption({ label: 'Moda Sul Confecções' }); await L('Local de estoque').selectOption({ label: 'B-02' });
await shot(page, 'produto-local', cardOf(page, 'Localização'));
await shot(page, 'produto-ia', T('Classificar com IA').locator('xpath=ancestor::div[2]'));
await shot(page, 'produto-salvar', B(/Salvar produto/));
await B(/Salvar produto/).click(); await page.waitForTimeout(3000);
await shot(page, 'produto-salvo');

// Importação
await go(page, '/products/import');
await shot(page, 'importar-arquivo', B(/Baixar modelo/));
await page.locator('input[type=file]').first().setInputFiles(path.resolve('importacao-exemplo.csv'));
await page.waitForTimeout(1500);
const dest = page.getByLabel(/Unidade de destino/).first(); if (await dest.count()) await dest.selectOption({ index: 1 }).catch(() => {});
const next = page.getByRole('button', { name: /Revisar|Continuar|Avançar/ }).first(); if (await next.count()) { await next.click().catch(() => {}); await page.waitForTimeout(2000); }
await shot(page, 'importar-revisar', T('rejeitad').locator('xpath=ancestor::div[2]'));

// Reajuste em lote
await go(page, '/products/pricing');
await shot(page, 'reajuste-escopo', cardOf(page, 'Escopo'));
await shot(page, 'reajuste-simulacao', cardOf(page, 'Simula'));

// Etiquetas
await go(page, '/labels');
await shot(page, 'etiquetas-modelo', cardOf(page, 'Modelo'));
await pick(page, 'fone', 'ELE-FONEAN-PR-128');
await shot(page, 'etiquetas-fila', B(/Imprimir etiquetas/));
await browser.close();

// Cadastro pelo celular
const m = await open('state-owner.json', { width: 390, height: 844 }, { isMobile: true, hasTouch: true });
await go(m.page, '/mobile/capture');
await shot(m.page, 'mobile-cadastro');
await m.browser.close();
