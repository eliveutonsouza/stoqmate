import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { FilterChip } from "./filter-chip";

const meta: Meta<typeof FilterChip> = {
  title: "UI/FilterChip",
  component: FilterChip,
};
export default meta;
type Story = StoryObj<typeof FilterChip>;

export const Default: Story = {
  args: { label: "Categoria", value: "Eletrônicos" },
};

export const Toggle: Story = {
  args: { label: "Com crédito em loja", active: false, onClick: fn() },
};

export const ToggleActive: Story = {
  args: { label: "Com crédito em loja", active: true, onClick: fn() },
};

export const Select: Story = {
  args: {
    label: "Estoque",
    value: "Abaixo do mínimo",
    active: true,
    selected: "low",
    options: [
      { value: "", label: "Todos" },
      { value: "in", label: "Em estoque" },
      { value: "low", label: "Abaixo do mínimo" },
      { value: "out", label: "Zerado" },
    ],
    onChange: fn(),
  },
};
