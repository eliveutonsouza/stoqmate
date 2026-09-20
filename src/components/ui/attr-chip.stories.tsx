import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AttrChip } from "./attr-chip";

const meta: Meta<typeof AttrChip> = {
  title: "UI/AttrChip",
  component: AttrChip,
};
export default meta;
type Story = StoryObj<typeof AttrChip>;

export const Cor: Story = {
  args: { value: "Preto" },
};

export const Texto: Story = {
  args: { value: "128 GB" },
};

export const Vazio: Story = {
  args: { value: "—" },
};
