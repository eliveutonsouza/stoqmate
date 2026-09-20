import type { Meta, StoryObj } from "@storybook/nextjs-vite";
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
