import { templateById } from "@/lib/category-templates";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProductThumb } from "./product-thumb";

const meta: Meta<typeof ProductThumb> = {
  title: "UI/ProductThumb",
  component: ProductThumb,
};
export default meta;
type Story = StoryObj<typeof ProductThumb>;

export const Default: Story = {
  args: { category: templateById("eletronicos"), brand: "Foneclear", attrs: { cor: "Preto" } },
};

export const Grande: Story = {
  args: { category: templateById("calcados"), brand: "Olympikus", attrs: { cor: "Azul" }, size: 48 },
};
