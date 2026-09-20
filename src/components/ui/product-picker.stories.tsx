import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProductPicker } from "./product-picker";

const meta: Meta<typeof ProductPicker> = {
  title: "UI/ProductPicker",
  component: ProductPicker,
};
export default meta;
type Story = StoryObj<typeof ProductPicker>;

export const Vazio: Story = {
  args: { product: null },
};

export const Selecionado: Story = {
  args: {
    product: {
      sku: "ELE-FONE-PR-128", cat: "eletronicos", brand: "Foneclear",
      name: "Fone Bluetooth ANC", attrs: { cor: "Preto", capacidade: "128 GB" }, stock: 42,
    },
    onClear: () => {},
  },
};
