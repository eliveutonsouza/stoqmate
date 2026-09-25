import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
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

// Busca controlada com debounce + chips funcionais (escolha e liga/desliga).
export const WithSearchAndFilters: Story = {
  args: {
    placeholder: "Buscar por SKU, código de barras, marca ou nome…",
    value: "fone",
    onChange: fn(),
    debounce: 300,
    filters: [
      {
        label: "Marca", value: "Voltway", active: true, selected: "Voltway", onChange: fn(),
        options: [{ value: "", label: "Todas" }, { value: "Voltway", label: "Voltway" }, { value: "Foneclear", label: "Foneclear" }],
      },
      { label: "Abaixo do mínimo", active: false, onClick: fn() },
    ],
    right: <span style={{ fontSize: 12, color: "var(--fg-muted)" }}>12 de 340</span>,
  },
};
