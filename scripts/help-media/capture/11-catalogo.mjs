import { open, go, shot, cardOf } from './cap.mjs';
const { browser, page } = await open('state-owner.json');
const T = (t) => page.getByText(t, { exact: false }).first();
const B = (n) => page.getByRole('button', { name: n }).first();
const dialog = () => page.locator('[role=dialog]').first();

// Categorias
await go(page, '/categories');
await shot(page, 'categorias-lista', B(/Nova categoria/));
await B(/Nova categoria/).click(); await page.waitForTimeout(600);
await shot(page, 'categorias-nova', dialog());
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
await shot(page, 'categorias-atributos', cardOf(page, 'Tamanho'));
// Catálogo
await go(page, '/products');
await shot(page, 'catalogo-lista', B(/Cadastrar produto/));
await page.getByPlaceholder(/Buscar por SKU/).first().fill('camiseta'); await page.waitForTimeout(1500);
await shot(page, 'catalogo-filtros', page.getByPlaceholder(/Buscar por SKU/).first().locator('xpath=ancestor::div[2]'));
// Ficha do produto
await go(page, '/products');
await T('Fone Bluetooth ANC').click(); await page.waitForTimeout(2000);
await shot(page, 'produto-ficha');
await shot(page, 'produto-rede', cardOf(page, 'na rede'));
// Cadastro
await go(page, '/products/new');
await shot(page, 'produto-categoria', cardOf(page, 'Categoria'));
await browser.close();
