import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Toolbar } from "./toolbar";

const meta: Meta<typeof Toolbar> = {
  title: "UI/Toolbar",
  component: Toolbar,
};
export default meta;
type Story = StoryObj<typeof Toolbar>;

export const Default: Story = {
  args: {
    placeholder: "Buscar produtos, SKUs...",
    filters: [{ label: "Categoria", value: "Eletrônicos" }, { label: "Status", value: "Ativo" }],
    right: <button className="btn btn-primary btn-sm">Cadastrar produto</button>,
  },
};
