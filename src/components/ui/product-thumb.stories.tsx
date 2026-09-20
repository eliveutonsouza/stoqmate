import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProductThumb } from "./product-thumb";

const meta: Meta<typeof ProductThumb> = {
  title: "UI/ProductThumb",
  component: ProductThumb,
};
export default meta;
type Story = StoryObj<typeof ProductThumb>;

export const Default: Story = {
  args: { cat: "eletronicos", brand: "Foneclear", attrs: { cor: "Preto" } },
};

export const Grande: Story = {
  args: { cat: "calcados", brand: "Olympikus", attrs: { cor: "Azul" }, size: 48 },
};
